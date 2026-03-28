export interface ActiveApplication {
  id: string;
  company_name: string;
  status: string;
  role: string;
  recruiter: string;
  resume_submitted: string;
  referral: string;
  last_contact_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}
