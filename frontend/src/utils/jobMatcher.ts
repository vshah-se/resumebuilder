import { findSkillsInText } from './skillsDictionary';

export interface MatchAnalysis {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
}

const REQUIRED_HEADERS = /\b(?:requirements?|qualifications?|must\s+have|required|what\s+you(?:'ll)?\s+need|minimum\s+qualifications?)\b/i;
const PREFERRED_HEADERS = /\b(?:preferred|nice\s+to\s+have|bonus|desired|plus|ideally)\b/i;

interface WeightedSkill {
  name: string;
  weight: number;
}

function extractWeightedSkills(jdText: string): WeightedSkill[] {
  const lines = jdText.split('\n');
  let currentWeight = 1.0;
  const skillWeights = new Map<string, number>();

  // Process line by line to detect section context
  for (const line of lines) {
    if (REQUIRED_HEADERS.test(line)) {
      currentWeight = 1.0;
    } else if (PREFERRED_HEADERS.test(line)) {
      currentWeight = 0.5;
    }

    const skillsInLine = findSkillsInText(line);
    for (const skill of skillsInLine) {
      // Keep the highest weight if a skill appears in multiple sections
      const existing = skillWeights.get(skill) ?? 0;
      skillWeights.set(skill, Math.max(existing, currentWeight));
    }
  }

  // Also do a full-text scan for skills not caught line-by-line
  const allSkills = findSkillsInText(jdText);
  for (const skill of allSkills) {
    if (!skillWeights.has(skill)) {
      skillWeights.set(skill, 0.75); // Default weight for skills found without section context
    }
  }

  return Array.from(skillWeights.entries()).map(([name, weight]) => ({ name, weight }));
}

export function analyzeMatch(
  profileSkills: string[],
  workExperiences: { experience_summary?: string }[],
  education: { degree?: string }[],
  jdRawText: string,
): MatchAnalysis {
  // Build candidate skill set from explicit skills + implied from experience
  const candidateSkillsSet = new Set<string>(
    profileSkills.map((s) => s.toLowerCase())
  );

  // Scan experience summaries for implied skills
  const experienceText = workExperiences
    .map((w) => w.experience_summary || '')
    .join(' ');
  for (const skill of findSkillsInText(experienceText)) {
    candidateSkillsSet.add(skill);
  }

  // Scan education degrees for implied skills
  const educationText = education.map((e) => e.degree || '').join(' ');
  for (const skill of findSkillsInText(educationText)) {
    candidateSkillsSet.add(skill);
  }

  // Extract weighted skills from JD
  const jdSkills = extractWeightedSkills(jdRawText);

  if (jdSkills.length === 0) {
    return {
      matchScore: 50,
      matchedSkills: [],
      missingSkills: [],
      recommendations: [
        'Could not identify specific skill requirements from the job description.',
        'Consider reviewing the job description manually and comparing with your profile.',
      ],
      summary: 'The job description does not contain clearly identifiable skill requirements for automated matching. Review the full description manually.',
    };
  }

  // Compute intersection
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let weightedMatched = 0;
  let weightedTotal = 0;

  for (const jdSkill of jdSkills) {
    weightedTotal += jdSkill.weight;
    if (candidateSkillsSet.has(jdSkill.name)) {
      matchedSkills.push(jdSkill.name);
      weightedMatched += jdSkill.weight;
    } else {
      missingSkills.push(jdSkill.name);
    }
  }

  let matchScore = Math.round((weightedMatched / weightedTotal) * 100);

  // Bonus for experience quantity (up to +5)
  if (workExperiences.length >= 3) matchScore = Math.min(100, matchScore + 5);
  else if (workExperiences.length >= 1) matchScore = Math.min(100, matchScore + 2);

  // Bonus for education (up to +5)
  if (education.length > 0) matchScore = Math.min(100, matchScore + 3);

  // Generate recommendations
  const recommendations: string[] = [];

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    recommendations.push(
      `Consider highlighting experience with ${topMissing} if you have related knowledge.`
    );
  }

  if (matchScore >= 80) {
    recommendations.push('Strong match -- focus your resume on the matched skills and quantify achievements.');
  } else if (matchScore >= 50) {
    recommendations.push('Good foundation -- consider obtaining certifications or projects demonstrating missing skills.');
  } else {
    recommendations.push('Consider gaining experience in the missing skills through projects, courses, or certifications.');
  }

  if (missingSkills.length > matchedSkills.length) {
    recommendations.push('Tailor your resume to emphasize transferable skills and relevant experience.');
  }

  // Generate summary
  const matchedCount = matchedSkills.length;
  const totalCount = jdSkills.length;
  let summary: string;

  if (matchScore >= 80) {
    summary = `Your profile is a strong match at ${matchScore}% with ${matchedCount} of ${totalCount} identified skills. Your experience aligns well with the role requirements.`;
  } else if (matchScore >= 50) {
    summary = `Your profile matches ${matchScore}% of the requirements with ${matchedCount} of ${totalCount} skills. You have a solid foundation but some skill gaps to address.`;
  } else {
    summary = `Your profile matches ${matchScore}% of the requirements with ${matchedCount} of ${totalCount} skills. Consider building experience in the missing areas before applying.`;
  }

  return { matchScore, matchedSkills, missingSkills, recommendations, summary };
}
