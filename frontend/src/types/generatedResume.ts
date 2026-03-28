export interface ResumeContent {
  summary: string;
  experience: {
    company: string;
    role: string;
    location: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    location: string;
  }[];
  skills: string[];
  highlights: string[];
}

export interface GeneratedResume {
  id: string;
  profile_id: string | null;
  job_description_id: string | null;
  content: ResumeContent;
  pdf_storage_path: string | null;
  docx_storage_path: string | null;
  include_photo: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}
