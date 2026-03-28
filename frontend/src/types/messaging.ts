export interface MessagingSequence {
  id: string;
  company_name: string;
  role: string;
  recruiter_email: string;
  recruiter_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  sequence_id: string;
  stage: string;
  prompt: string;
  generated_content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}
