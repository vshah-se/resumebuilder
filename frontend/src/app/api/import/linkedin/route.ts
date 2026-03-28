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

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'LinkedIn export must be a PDF file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text: rawText } = await extractText(new Uint8Array(buffer), { mergePages: true });

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from LinkedIn PDF' }, { status: 400 });
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
          content: `You are an expert at parsing LinkedIn profile exports. Extract structured information from the provided LinkedIn PDF text and return it as JSON.

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
    "import_source": "linkedin"
  },
  "workExperiences": [
    {
      "company_name": "",
      "city": "",
      "state": "",
      "start_date": "YYYY-MM-DD or empty",
      "end_date": "YYYY-MM-DD or empty",
      "is_current": false,
      "experience_summary": "Full description of role and achievements"
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
- LinkedIn PDFs have a specific format with sections like "Experience", "Education", "Skills"
- Extract ALL work experiences, education entries, and skills
- For dates, use YYYY-MM-DD format. If only month/year is given, use the 1st of the month
- LinkedIn often shows dates as "Mon YYYY - Mon YYYY" or "Mon YYYY - Present"
- If a field is not found, use an empty string
- For is_current, set true if the position says "Present" or has no end date
- Extract all listed skills from the Skills section
- The name is typically the first prominent text in the LinkedIn PDF`,
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
      parsed.personalInfo.import_source = 'linkedin';
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('LinkedIn import error:', err);
    return NextResponse.json({ error: 'Failed to parse LinkedIn export' }, { status: 500 });
  }
}
