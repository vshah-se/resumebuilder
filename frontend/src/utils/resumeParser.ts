import {
  splitIntoLines,
  extractEmail,
  extractPhone,
  extractLinkedIn,
  extractUrls,
  extractLocation,
  hasDatePattern,
} from './textUtils';
import { findSkillsInText, extractSkillsFromList } from './skillsDictionary';

export interface ParsedProfile {
  personalInfo: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    linkedin: string;
    portfolio_link: string;
    import_source?: string;
  };
  workExperiences: {
    company_name: string;
    city: string;
    state: string;
    country: string;
    website_link: string;
    experience_summary: string;
  }[];
  education: {
    school_name: string;
    city: string;
    state: string;
    country: string;
    degree: string;
  }[];
  skills: string[];
}

type SectionType = 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'unknown';

interface Section {
  type: SectionType;
  lines: string[];
}

const SECTION_PATTERNS: Record<SectionType, RegExp> = {
  summary: /^(?:summary|profile|professional\s+summary|objective|about(?:\s+me)?)\s*$/i,
  experience: /^(?:experience|work\s+experience|professional\s+experience|employment|work\s+history|career\s+history)\s*$/i,
  education: /^(?:education|academic|academics|qualifications|degrees|educational\s+background)\s*$/i,
  skills: /^(?:skills|technical\s+skills|core\s+competencies|competencies|proficiencies|technologies|tools\s*(?:&|and)?\s*technologies|expertise|areas\s+of\s+expertise)\s*$/i,
  projects: /^(?:projects|personal\s+projects|key\s+projects|side\s+projects)\s*$/i,
  header: /^$/,   // never matches -- header is implicit
  unknown: /^$/,  // never matches
};

const DEGREE_KEYWORDS = /\b(?:bachelor|master|mba|ph\.?d|phd|associate|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|b\.?sc|m\.?sc|btech|mtech|diploma|certificate|doctor|juris)\b/i;
const SCHOOL_KEYWORDS = /\b(?:university|college|institute|school|academy|polytechnic)\b/i;
const BULLET_RE = /^[\u2022\u2023\u25E6\u2043\u2219•\-\*\>→▸]\s*/;

function isSectionHeader(line: string): SectionType | null {
  const cleaned = line.replace(/[:\-–—|]/g, '').trim();
  if (cleaned.length === 0 || cleaned.length > 50) return null;

  for (const [type, pattern] of Object.entries(SECTION_PATTERNS) as [SectionType, RegExp][]) {
    if (type === 'header' || type === 'unknown') continue;
    if (pattern.test(cleaned)) return type;
  }

  // Heuristic: short line that's mostly uppercase
  if (cleaned.length < 35 && cleaned === cleaned.toUpperCase() && /[A-Z]{3,}/.test(cleaned)) {
    // Try to classify the uppercase header
    for (const [type, pattern] of Object.entries(SECTION_PATTERNS) as [SectionType, RegExp][]) {
      if (type === 'header' || type === 'unknown') continue;
      if (pattern.test(cleaned.toLowerCase())) return type;
    }
  }

  return null;
}

function detectSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { type: 'header', lines: [] };

  for (const line of lines) {
    const sectionType = isSectionHeader(line);
    if (sectionType) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { type: sectionType, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function extractPersonalInfo(headerLines: string[], fullText: string) {
  const text = headerLines.join('\n');

  // Name: first non-empty line that isn't an email/phone/URL
  let firstName = '';
  let lastName = '';
  for (const line of headerLines) {
    if (
      extractEmail(line) === line.trim() ||
      /^\+?\d[\d\s\-().]+$/.test(line.trim()) ||
      /^https?:\/\//.test(line.trim()) ||
      /linkedin\.com/i.test(line)
    ) {
      continue;
    }
    // This is likely the name
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 1) {
      firstName = titleCase(parts[0]);
      lastName = parts.slice(1).map(titleCase).join(' ');
      break;
    }
  }

  const email = extractEmail(text) || extractEmail(fullText);
  const phone = extractPhone(text) || extractPhone(fullText);
  const linkedin = extractLinkedIn(text) || extractLinkedIn(fullText);
  const urls = extractUrls(text);
  const portfolioLink = urls.length > 0 ? urls[0] : '';
  const location = extractLocation(text);

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    city: location.city,
    state: location.state,
    linkedin,
    portfolio_link: portfolioLink,
  };
}

function extractWorkExperience(lines: string[]) {
  if (lines.length === 0) return [];

  const entries: ParsedProfile['workExperiences'] = [];
  let currentEntry: {
    headerLines: string[];
    bullets: string[];
  } | null = null;

  for (const line of lines) {
    // A line with a date pattern typically starts a new entry
    if (hasDatePattern(line) && currentEntry && currentEntry.bullets.length > 0) {
      // This date line starts a new entry -- save current one first
      entries.push(buildExperienceEntry(currentEntry));
      currentEntry = { headerLines: [line], bullets: [] };
    } else if (hasDatePattern(line) && !currentEntry) {
      currentEntry = { headerLines: [line], bullets: [] };
    } else if (hasDatePattern(line) && currentEntry && currentEntry.bullets.length === 0) {
      // Add date line to current header
      currentEntry.headerLines.push(line);
    } else if (!currentEntry) {
      // Line before any date pattern -- start an entry
      currentEntry = { headerLines: [line], bullets: [] };
    } else if (BULLET_RE.test(line) || (currentEntry.headerLines.length > 0 && !hasDatePattern(line))) {
      currentEntry.bullets.push(line.replace(BULLET_RE, '').trim());
    } else {
      currentEntry.headerLines.push(line);
    }
  }

  if (currentEntry) {
    entries.push(buildExperienceEntry(currentEntry));
  }

  return entries;
}

function buildExperienceEntry(entry: { headerLines: string[]; bullets: string[] }): ParsedProfile['workExperiences'][0] {
  const headerText = entry.headerLines.join(' ');
  const location = extractLocation(headerText);

  // Try to extract company name from first non-date header line
  let companyName = '';
  for (const line of entry.headerLines) {
    if (!hasDatePattern(line)) {
      // Take the first substantial non-date line as company/role
      companyName = line.replace(/[|–—\-]+/g, ' ').trim();
      break;
    }
  }

  return {
    company_name: companyName || entry.headerLines[0] || '',
    city: location.city,
    state: location.state,
    country: '',
    website_link: '',
    experience_summary: entry.bullets.join('\n'),
  };
}

function extractEducation(lines: string[]) {
  if (lines.length === 0) return [];

  const entries: ParsedProfile['education'] = [];
  let currentLines: string[] = [];

  for (const line of lines) {
    // Start a new entry when we see a degree keyword or school keyword on a new line
    if (
      (DEGREE_KEYWORDS.test(line) || SCHOOL_KEYWORDS.test(line)) &&
      currentLines.length > 0
    ) {
      entries.push(buildEducationEntry(currentLines));
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    entries.push(buildEducationEntry(currentLines));
  }

  return entries;
}

function buildEducationEntry(lines: string[]): ParsedProfile['education'][0] {
  const text = lines.join(' ');
  const location = extractLocation(text);

  let schoolName = '';
  let degree = '';

  for (const line of lines) {
    if (SCHOOL_KEYWORDS.test(line) && !schoolName) {
      schoolName = line.replace(/[|–—\-,]+\s*$/, '').trim();
    } else if (DEGREE_KEYWORDS.test(line) && !degree) {
      degree = line.replace(/[|–—\-,]+\s*$/, '').trim();
    }
  }

  // Fallback: first line is school, second is degree
  if (!schoolName && lines.length > 0) {
    schoolName = lines[0].replace(/[|–—\-,]+\s*$/, '').trim();
  }
  if (!degree && lines.length > 1) {
    degree = lines[1].replace(/[|–—\-,]+\s*$/, '').trim();
  }

  return {
    school_name: schoolName,
    city: location.city,
    state: location.state,
    country: '',
    degree,
  };
}

function extractSkills(skillLines: string[], fullText: string): string[] {
  const explicit = skillLines.length > 0
    ? extractSkillsFromList(skillLines.join('\n'))
    : [];
  const detected = findSkillsInText(fullText);

  // Merge and deduplicate (case-insensitive)
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of [...explicit, ...detected]) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(skill);
    }
  }
  return result;
}

function titleCase(str: string): string {
  if (!str) return '';
  if (str === str.toUpperCase()) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseResumeText(rawText: string): ParsedProfile {
  const lines = splitIntoLines(rawText);
  const sections = detectSections(lines);

  const headerSection = sections.find((s) => s.type === 'header');
  const experienceSection = sections.find((s) => s.type === 'experience');
  const educationSection = sections.find((s) => s.type === 'education');
  const skillsSection = sections.find((s) => s.type === 'skills');

  const personalInfo = extractPersonalInfo(headerSection?.lines || lines.slice(0, 5), rawText);
  const workExperiences = extractWorkExperience(experienceSection?.lines || []);
  const education = extractEducation(educationSection?.lines || []);
  const skills = extractSkills(skillsSection?.lines || [], rawText);

  return { personalInfo, workExperiences, education, skills };
}
