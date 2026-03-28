import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/insforge';
import { getAIClient, getModel, validateAIConfig } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { profileId, jobDescriptionId } = await req.json();

    if (!profileId || !jobDescriptionId) {
      return NextResponse.json({ error: 'profileId and jobDescriptionId are required' }, { status: 400 });
    }

    const insforge = createServerClient();

    // Fetch profile with related data
    const { data: profile, error: profileError } = await insforge.database
      .from('profiles')
      .select('*, work_experiences(*), education(*), skills(*)')
      .eq('id', profileId)
      .limit(1);

    if (profileError || !profile?.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch job description
    const { data: jdData, error: jdError } = await insforge.database
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .limit(1);

    if (jdError || !jdData?.length) {
      return NextResponse.json({ error: 'Job description not found' }, { status: 404 });
    }

    const fullProfile = profile[0];
    const jd = jdData[0];

    const configError = validateAIConfig();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const openai = getAIClient();

    const profileData = `
Name: ${fullProfile.first_name} ${fullProfile.last_name}
Email: ${fullProfile.email || ''}
Phone: ${fullProfile.phone || ''}
Location: ${[fullProfile.city, fullProfile.state].filter(Boolean).join(', ')}
LinkedIn: ${fullProfile.linkedin || ''}
Portfolio: ${fullProfile.portfolio_link || ''}

WORK EXPERIENCE:
${(fullProfile.work_experiences || []).map((w: { company_name: string; city: string; state: string; experience_summary: string }) =>
  `${w.company_name} (${[w.city, w.state].filter(Boolean).join(', ')}):\n${w.experience_summary}`
).join('\n\n')}

EDUCATION:
${(fullProfile.education || []).map((e: { degree: string; school_name: string; city: string; state: string }) =>
  `${e.degree} - ${e.school_name} (${[e.city, e.state].filter(Boolean).join(', ')})`
).join('\n')}

SKILLS:
${(fullProfile.skills || []).map((s: { name: string }) => s.name).join(', ')}
`.trim();

    const completion = await openai.chat.completions.create({
      model: getModel(process.env.AI_MODEL || 'gpt-4o-mini'),
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert resume writer who creates ATS-optimized resumes tailored to specific job descriptions.

Given the candidate's profile and a job description, generate an optimized resume. Emphasize relevant experience and skills that match the JD. Use strong action verbs and quantify achievements where possible.

Return JSON with this exact structure:
{
  "content": {
    "summary": "2-3 sentence professional summary tailored to the role",
    "experience": [
      {
        "company": "Company Name",
        "role": "Job Title",
        "location": "City, State",
        "bullets": ["Achievement 1 with metrics", "Achievement 2"]
      }
    ],
    "education": [
      {
        "school": "University Name",
        "degree": "Degree Title",
        "location": "City, State"
      }
    ],
    "skills": ["Skill 1", "Skill 2"],
    "highlights": ["Key highlight 1", "Key highlight 2"]
  }
}

Guidelines:
- Rewrite experience bullets to be ATS-friendly and relevant to the job
- Prioritize skills that match the JD
- Use industry keywords from the JD
- Keep bullets concise but impactful
- Include 3-5 bullets per experience entry`,
        },
        {
          role: 'user',
          content: `CANDIDATE PROFILE:\n${profileData}\n\nTARGET JOB DESCRIPTION:\n${jd.raw_text?.slice(0, 6000)}`,
        },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (err) {
    console.error('Resume generation error:', err);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
