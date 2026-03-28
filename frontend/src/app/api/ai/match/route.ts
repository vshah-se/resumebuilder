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

    // Fetch profile with skills
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

    const configError = validateAIConfig();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const fullProfile = profile[0];
    const jd = jdData[0];

    // Build candidate skill set
    const candidateSkills = (fullProfile.skills || []).map((s: { name: string }) => s.name);
    const experienceText = (fullProfile.work_experiences || [])
      .map((w: { experience_summary?: string }) => w.experience_summary || '')
      .join('\n');
    const educationText = (fullProfile.education || [])
      .map((e: { degree?: string; field_of_study?: string }) =>
        [e.degree, e.field_of_study].filter(Boolean).join(' - ')
      )
      .join('\n');

    const profileSummary = `
SKILLS: ${candidateSkills.join(', ')}

WORK EXPERIENCE:
${experienceText}

EDUCATION:
${educationText}
`.trim();

    const openai = getAIClient();

    const completion = await openai.chat.completions.create({
      model: getModel(process.env.AI_MODEL || 'gpt-4o-mini'),
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a technical recruiter analyzing a job description against a candidate's profile. Your task is to:

1. Extract the ACTUAL technical skills, tools, frameworks, and technologies required by the job description. Be precise:
   - Only extract skills that are explicitly required or preferred as technical competencies
   - Do NOT confuse common English words with tech skills (e.g. "scalability" is NOT "Scala", "go to market" is NOT "Go/Golang")
   - Distinguish between required skills and nice-to-have/preferred skills

2. Compare those skills against the candidate's profile (their listed skills, work experience, and education)

3. Provide a match analysis

Return JSON with this exact structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "matchedSkills": ["skills the candidate has that match required or preferred"],
  "missingRequired": ["required skills the candidate lacks"],
  "missingPreferred": ["preferred skills the candidate lacks"],
  "matchScore": 0-100,
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "summary": "2-3 sentence analysis of the match"
}

Scoring guidelines:
- matchScore should primarily reflect coverage of required skills
- Preferred/nice-to-have skills should have less weight (about 50% of required)
- Consider relevant experience even if the exact skill name isn't listed
- Be fair but honest -- don't inflate or deflate the score`,
        },
        {
          role: 'user',
          content: `JOB DESCRIPTION:\n${(jd.raw_text || '').slice(0, 6000)}\n\nCANDIDATE PROFILE:\n${profileSummary.slice(0, 4000)}`,
        },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // Normalize to the response format the frontend expects
    return NextResponse.json({
      matchScore: result.matchScore ?? 0,
      matchedSkills: result.matchedSkills ?? [],
      missingSkills: [...(result.missingRequired ?? []), ...(result.missingPreferred ?? [])],
      requiredSkills: result.requiredSkills ?? [],
      preferredSkills: result.preferredSkills ?? [],
      missingRequired: result.missingRequired ?? [],
      missingPreferred: result.missingPreferred ?? [],
      recommendations: result.recommendations ?? [],
      summary: result.summary ?? '',
    });
  } catch (err) {
    console.error('Match analysis error:', err);
    return NextResponse.json({ error: 'Failed to analyze match' }, { status: 500 });
  }
}
