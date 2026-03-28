export interface Application {
  id: string;
  company_name: string;
  job_id: string;
  job_description: string;
  job_description_id: string | null;
  resume_submitted: string;
  generated_resume_id: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  referral: string;
  comments: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
}
