import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { getAIClient, getModel, validateAIConfig } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    if (file.name.endsWith('.pdf')) {
      const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
      rawText = text;
    } else if (file.name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use PDF or DOCX.' }, { status: 400 });
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    const configError = validateAIConfig();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const openai = getAIClient();

    const completion = await openai.chat.completions.create({
      model: getModel(process.env.AI_MODEL || 'gpt-4o-mini'),
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert resume parser. Extract structured information from the provided resume text and return it as JSON.

Return JSON with this exact structure:
{
  "personalInfo": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "city": "",
    "state": "",
    "linkedin": "",
    "portfolio_link": "",
    "import_source": "resume"
  },
  "workExperiences": [
    {
      "company_name": "",
      "city": "",
      "state": "",
      "start_date": "YYYY-MM-DD or empty",
      "end_date": "YYYY-MM-DD or empty",
      "is_current": false,
      "experience_summary": "Full description with bullet points"
    }
  ],
  "education": [
    {
      "school_name": "",
      "degree": "",
      "field_of_study": "",
      "city": "",
      "state": "",
      "start_date": "YYYY-MM-DD or empty",
      "end_date": "YYYY-MM-DD or empty",
      "is_current": false
    }
  ],
  "skills": ["skill1", "skill2"]
}

Guidelines:
- Extract ALL work experiences, education entries, and skills found in the resume
- For dates, use YYYY-MM-DD format. If only month/year is given, use the 1st of the month
- If a field is not found, use an empty string
- For is_current, set true if the position says "Present", "Current", or has no end date
- Include the full job description/bullet points in experience_summary
- Extract technical skills, soft skills, tools, and technologies`,
        },
        {
          role: 'user',
          content: rawText.slice(0, 8000),
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    // Ensure import_source is set
    if (parsed.personalInfo) {
      parsed.personalInfo.import_source = 'resume';
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Resume import error:', err);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
