export interface MatchAnalysis {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
}

export interface JobDescription {
  id: string;
  profile_id: string | null;
  company_name: string;
  role_title: string;
  source_url: string;
  raw_text: string;
  match_score: number | null;
  match_analysis: MatchAnalysis | null;
  status: string;
  created_at: string;
  updated_at: string;
}
