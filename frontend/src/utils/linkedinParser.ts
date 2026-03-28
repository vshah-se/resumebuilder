import {
  splitIntoLines,
  extractEmail,
  extractPhone,
  extractLinkedIn,
  extractUrls,
  extractLocation,
} from './textUtils';
import { findSkillsInText } from './skillsDictionary';
import { parseResumeText, type ParsedProfile } from './resumeParser';

// LinkedIn PDF exports use these exact section headers
const LINKEDIN_SECTIONS = [
  'Contact',
  'Top Skills',
  'Languages',
  'Certifications',
  'Honors-Awards',
  'Summary',
  'Experience',
  'Education',
  'Skills',
  'Licenses & Certifications',
  'Volunteer Experience',
  'Projects',
  'Publications',
  'Courses',
  'Organizations',
];

const SECTION_RE = new RegExp(`^(${LINKEDIN_SECTIONS.join('|')})$`, 'i');

interface LinkedInSections {
  header: string[];
  contact: string[];
  topSkills: string[];
  summary: string[];
  experience: string[];
  education: string[];
  skills: string[];
  [key: string]: string[];
}

function splitLinkedInSections(lines: string[]): LinkedInSections {
  const sections: LinkedInSections = {
    header: [],
    contact: [],
    topSkills: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
  };

  let currentKey = 'header';

  for (const line of lines) {
    if (SECTION_RE.test(line.trim())) {
      const section = line.trim().toLowerCase();
      if (section === 'contact') currentKey = 'contact';
      else if (section === 'top skills') currentKey = 'topSkills';
      else if (section === 'summary') currentKey = 'summary';
      else if (section === 'experience') currentKey = 'experience';
      else if (section === 'education') currentKey = 'education';
      else if (section === 'skills') currentKey = 'skills';
      else currentKey = section;
      if (!sections[currentKey]) sections[currentKey] = [];
    } else {
      sections[currentKey].push(line);
    }
  }

  return sections;
}

function parseLinkedInExperience(lines: string[]): ParsedProfile['workExperiences'] {
  const entries: ParsedProfile['workExperiences'] = [];

  // LinkedIn experience format:
  // Job Title
  // Company Name · Employment Type
  // Date Range · Duration
  // Location (optional)
  // Description lines...

  let i = 0;
  while (i < lines.length) {
    const title = lines[i];
    i++;

    // Look for company line (contains · or is next line)
    let companyName = '';
    if (i < lines.length) {
      const companyLine = lines[i];
      // Company lines often contain · (middle dot) separator
      if (companyLine.includes('·') || companyLine.includes('·')) {
        companyName = companyLine.split(/[··]/)[0].trim();
        i++;
      } else {
        companyName = companyLine;
        i++;
      }
    }

    // Skip date line and location line
    const summaryLines: string[] = [];
    while (i < lines.length) {
      const line = lines[i];
      // Check if this is the start of a new entry (looks like a job title)
      // Heuristic: if the next line contains · it's probably a company line
      if (i + 1 < lines.length && (lines[i + 1].includes('·') || lines[i + 1].includes('·'))) {
        break;
      }
      // Date patterns or location lines -- skip but don't break
      if (/^\d{4}|^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line)) {
        i++;
        continue;
      }
      summaryLines.push(line);
      i++;
    }

    const location = extractLocation([title, companyName, ...summaryLines.slice(0, 2)].join(' '));

    entries.push({
      company_name: companyName || title,
      city: location.city,
      state: location.state,
      country: '',
      website_link: '',
      experience_summary: `${title}\n${summaryLines.join('\n')}`.trim(),
    });
  }

  return entries;
}

function parseLinkedInEducation(lines: string[]): ParsedProfile['education'] {
  const entries: ParsedProfile['education'] = [];

  // LinkedIn education format:
  // School Name
  // Degree, Field of Study
  // Date Range

  let i = 0;
  while (i < lines.length) {
    const schoolName = lines[i];
    i++;

    let degree = '';
    if (i < lines.length && !/^\d{4}/.test(lines[i])) {
      degree = lines[i];
      i++;
    }

    // Skip date line
    if (i < lines.length && /^\d{4}/.test(lines[i])) {
      i++;
    }

    const location = extractLocation(schoolName);

    entries.push({
      school_name: schoolName,
      city: location.city,
      state: location.state,
      country: '',
      degree,
    });
  }

  return entries;
}

export function parseLinkedInText(rawText: string): ParsedProfile {
  const lines = splitIntoLines(rawText);

  // Verify this looks like a LinkedIn PDF by checking for known section headers
  const hasLinkedInSections = lines.some((l) => SECTION_RE.test(l.trim()));
  if (!hasLinkedInSections) {
    // Fall back to generic parser
    const result = parseResumeText(rawText);
    result.personalInfo.import_source = 'linkedin';
    return result;
  }

  const sections = splitLinkedInSections(lines);
  const fullText = rawText;

  // Personal info from header (first few lines: Name, Title, Location)
  let firstName = '';
  let lastName = '';
  if (sections.header.length > 0) {
    const nameLine = sections.header[0];
    const parts = nameLine.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const contactText = sections.contact.join('\n');
  const headerText = sections.header.join('\n');

  const location = extractLocation(headerText) || { city: '', state: '' };

  const personalInfo = {
    first_name: firstName,
    last_name: lastName,
    email: extractEmail(contactText) || extractEmail(fullText),
    phone: extractPhone(contactText) || extractPhone(fullText),
    city: location.city,
    state: location.state,
    linkedin: extractLinkedIn(contactText) || extractLinkedIn(fullText),
    portfolio_link: (extractUrls(contactText)[0] || ''),
    import_source: 'linkedin' as const,
  };

  const workExperiences = parseLinkedInExperience(sections.experience);
  const education = parseLinkedInEducation(sections.education);

  // Skills from explicit skills sections + full-text scan
  const explicitSkills = [
    ...sections.topSkills,
    ...sections.skills,
  ].filter((s) => s.length > 0 && s.length < 60);

  const detectedSkills = findSkillsInText(fullText);

  const seen = new Set<string>();
  const skills: string[] = [];
  for (const skill of [...explicitSkills, ...detectedSkills]) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      skills.push(skill);
    }
  }

  return { personalInfo, workExperiences, education, skills };
}
