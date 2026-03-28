import insforge from '@/lib/insforge';
import type { ActiveApplication } from '@/types/activeApplication';

export const activeApplicationService = {
  async list(): Promise<ActiveApplication[]> {
    const { data, error } = await insforge.database
      .from('active_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(app: Partial<ActiveApplication>): Promise<ActiveApplication> {
    const { data, error } = await insforge.database
      .from('active_applications')
      .insert([app])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, app: Partial<ActiveApplication>): Promise<ActiveApplication> {
    const { data, error } = await insforge.database
      .from('active_applications')
      .update({ ...app, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async remove(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('active_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
