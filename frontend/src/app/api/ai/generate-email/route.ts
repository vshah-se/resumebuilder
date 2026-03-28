import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/insforge';
import { getAIClient, getModel, validateAIConfig } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { sequenceId, stage, prompt } = await req.json();

    if (!sequenceId || !stage || !prompt) {
      return NextResponse.json({ error: 'sequenceId, stage, and prompt are required' }, { status: 400 });
    }

    const insforge = createServerClient();

    // Fetch sequence details
    const { data: seqData, error: seqError } = await insforge.database
      .from('messaging_sequences')
      .select('*')
      .eq('id', sequenceId)
      .limit(1);

    if (seqError || !seqData?.length) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Fetch existing messages in this sequence for context
    const { data: messages } = await insforge.database
      .from('messages')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('created_at', { ascending: true });

    // Fetch profile for personalization
    const { data: profileData } = await insforge.database
      .from('profiles')
      .select('*')
      .limit(1);

    const sequence = seqData[0];
    const profile = profileData?.[0];

    const configError = validateAIConfig();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const openai = getAIClient();

    const stageDescriptions: Record<string, string> = {
      initial_outreach: 'First contact email - professional, concise, shows genuine interest',
      follow_up_1: 'First follow-up - gentle reminder, adds new value or information',
      follow_up_2: 'Second follow-up - brief check-in, possibly new angle',
      follow_up_3: 'Final follow-up - respectful closing, leaves door open',
      thank_you: 'Thank you note - grateful, reiterates interest and key points',
    };

    const previousContext = (messages || [])
      .map((m: { stage: string; generated_content: string }) =>
        `[${m.stage}]: ${m.generated_content?.slice(0, 200)}`
      )
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: getModel(process.env.AI_MODEL || 'gpt-4o-mini'),
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing professional outreach emails for job seekers.

Write a ${stageDescriptions[stage] || stage} email.

Context:
- Recruiter: ${sequence.recruiter_name || 'Hiring Manager'} at ${sequence.company_name || 'the company'}
- Role: ${sequence.role || 'open position'}
- Sender: ${profile ? `${profile.first_name} ${profile.last_name}` : 'the candidate'}

${previousContext ? `Previous messages in this sequence:\n${previousContext}\n` : ''}

Guidelines:
- Keep it concise (under 200 words)
- Professional but personable tone
- Include a clear call-to-action
- Don't be overly formal or stiff
- Include subject line on first line prefixed with "Subject: "
- Return the email body after the subject line`,
        },
        { role: 'user', content: prompt },
      ],
    });

    const body = completion.choices[0].message.content || '';
    return NextResponse.json({ body });
  } catch (err) {
    console.error('Email generation error:', err);
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
