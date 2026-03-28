import insforge from '@/lib/insforge';
import type { Application } from '@/types/application';

export const applicationService = {
  async list(): Promise<Application[]> {
    const { data, error } = await insforge.database
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(app: Partial<Application>): Promise<Application> {
    const { data, error } = await insforge.database
      .from('applications')
      .insert([app])
      .select();
    if (error) throw error;
    return data![0];
  },

  async update(id: string, app: Partial<Application>): Promise<Application> {
    const { data, error } = await insforge.database
      .from('applications')
      .update({ ...app, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async remove(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
