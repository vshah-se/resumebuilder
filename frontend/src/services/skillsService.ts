import insforge from '@/lib/insforge';
import type { Skill } from '@/types/profile';

export const skillsService = {
  async list(profileId: string): Promise<Skill[]> {
    const { data, error } = await insforge.database
      .from('skills')
      .select('*')
      .eq('profile_id', profileId);
    if (error) throw error;
    return data ?? [];
  },

  async sync(profileId: string, skillNames: string[]): Promise<Skill[]> {
    // Delete all existing skills
    const { error: deleteError } = await insforge.database
      .from('skills')
      .delete()
      .eq('profile_id', profileId);
    if (deleteError) throw deleteError;

    if (skillNames.length === 0) return [];

    // Insert new skills
    const newSkills = skillNames.map((name) => ({
      profile_id: profileId,
      name,
    }));
    const { data, error } = await insforge.database
      .from('skills')
      .insert(newSkills)
      .select();
    if (error) throw error;
    return data ?? [];
  },
};
