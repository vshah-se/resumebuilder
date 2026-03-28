import insforge from '@/lib/insforge';
import type { Education } from '@/types/profile';

const EDU_FIELDS = [
  'profile_id', 'school_name', 'city', 'state', 'country',
  'degree', 'field_of_study', 'start_date', 'end_date',
  'is_current', 'sort_order',
] as const;

function pickEduFields(data: Partial<Education>): Partial<Education> {
  const result: Record<string, unknown> = {};
  for (const key of EDU_FIELDS) {
    if (key in data && data[key as keyof Education] !== undefined) {
      result[key] = data[key as keyof Education];
    }
  }
  return result as Partial<Education>;
}

export const educationService = {
  async list(profileId: string): Promise<Education[]> {
    const { data, error } = await insforge.database
      .from('education')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async create(edu: Partial<Education>): Promise<Education> {
    const { data, error } = await insforge.database
      .from('education')
      .insert([pickEduFields(edu)])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, edu: Partial<Education>): Promise<Education> {
    const { data, error } = await insforge.database
      .from('education')
      .update({ ...pickEduFields(edu), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async remove(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('education')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
