export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  portfolio_link: string;
  linkedin: string;
  profile_picture_path: string | null;
  import_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  profile_id: string;
  company_name: string;
  city: string;
  state: string;
  country: string;
  website_link: string;
  experience_summary: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  profile_id: string;
  school_name: string;
  city: string;
  state: string;
  country: string;
  degree: string;
  field_of_study: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  profile_id: string;
  name: string;
  category: string | null;
  proficiency: string | null;
  created_at: string;
}

export interface FullProfile extends Profile {
  work_experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
}

export type { ParsedProfile } from '@/utils/resumeParser';
