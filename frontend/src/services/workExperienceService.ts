import insforge from '@/lib/insforge';
import type { WorkExperience } from '@/types/profile';

const WE_FIELDS = [
  'profile_id', 'company_name', 'city', 'state', 'country',
  'website_link', 'experience_summary', 'start_date', 'end_date',
  'is_current', 'sort_order',
] as const;

function pickWEFields(data: Partial<WorkExperience>): Partial<WorkExperience> {
  const result: Record<string, unknown> = {};
  for (const key of WE_FIELDS) {
    if (key in data && data[key as keyof WorkExperience] !== undefined) {
      result[key] = data[key as keyof WorkExperience];
    }
  }
  return result as Partial<WorkExperience>;
}

export const workExperienceService = {
  async list(profileId: string): Promise<WorkExperience[]> {
    const { data, error } = await insforge.database
      .from('work_experiences')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async create(experience: Partial<WorkExperience>): Promise<WorkExperience> {
    const { data, error } = await insforge.database
      .from('work_experiences')
      .insert([pickWEFields(experience)])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, experience: Partial<WorkExperience>): Promise<WorkExperience> {
    const { data, error } = await insforge.database
      .from('work_experiences')
      .update({ ...pickWEFields(experience), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async remove(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('work_experiences')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
