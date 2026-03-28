import insforge from '@/lib/insforge';
import type { Profile, FullProfile } from '@/types/profile';

const PROFILE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'city', 'state',
  'portfolio_link', 'linkedin', 'profile_picture_path', 'import_source',
] as const;

function pickProfileFields(data: Partial<Profile>): Partial<Profile> {
  const result: Record<string, unknown> = {};
  for (const key of PROFILE_FIELDS) {
    if (key in data) result[key] = data[key as keyof Profile];
  }
  return result as Partial<Profile>;
}

export const profileService = {
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async getFullProfile(): Promise<FullProfile | null> {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('*, work_experiences(*), education(*), skills(*)')
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async upsertProfile(profileData: Partial<Profile>): Promise<Profile> {
    const clean = pickProfileFields(profileData);
    const existing = await this.getProfile();
    if (existing) {
      const { data, error } = await insforge.database
        .from('profiles')
        .update({ ...clean, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select();
      if (error) throw error;
      return data![0];
    } else {
      const { data, error } = await insforge.database
        .from('profiles')
        .insert([clean])
        .select();
      if (error) throw error;
      return data![0];
    }
  },
};
