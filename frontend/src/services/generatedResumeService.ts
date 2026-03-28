import insforge from '@/lib/insforge';
import type { GeneratedResume } from '@/types/generatedResume';

export const generatedResumeService = {
  async list(): Promise<GeneratedResume[]> {
    const { data, error } = await insforge.database
      .from('generated_resumes')
      .select('*, job_descriptions(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<GeneratedResume | null> {
    const { data, error } = await insforge.database
      .from('generated_resumes')
      .select('*, job_descriptions(*)')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async create(resume: Partial<GeneratedResume>): Promise<GeneratedResume> {
    const { data, error } = await insforge.database
      .from('generated_resumes')
      .insert([resume])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, resume: Partial<GeneratedResume>): Promise<GeneratedResume> {
    const { data, error } = await insforge.database
      .from('generated_resumes')
      .update({ ...resume, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },
};
