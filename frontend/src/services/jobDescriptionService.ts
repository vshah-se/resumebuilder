import insforge from '@/lib/insforge';
import type { JobDescription } from '@/types/jobDescription';

export const jobDescriptionService = {
  async list(): Promise<JobDescription[]> {
    const { data, error } = await insforge.database
      .from('job_descriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<JobDescription | null> {
    const { data, error } = await insforge.database
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async create(jd: Partial<JobDescription>): Promise<JobDescription> {
    const { data, error } = await insforge.database
      .from('job_descriptions')
      .insert([jd])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, jd: Partial<JobDescription>): Promise<JobDescription> {
    const { data, error } = await insforge.database
      .from('job_descriptions')
      .update({ ...jd, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async remove(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('job_descriptions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
