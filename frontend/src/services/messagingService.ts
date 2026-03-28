import insforge from '@/lib/insforge';
import type { MessagingSequence, Message } from '@/types/messaging';

export const messagingService = {
  async listSequences(): Promise<MessagingSequence[]> {
    const { data, error } = await insforge.database
      .from('messaging_sequences')
      .select('*, messages(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getSequence(id: string): Promise<MessagingSequence | null> {
    const { data, error } = await insforge.database
      .from('messaging_sequences')
      .select('*, messages(*)')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async createSequence(seq: Partial<MessagingSequence>): Promise<MessagingSequence> {
    const { data, error } = await insforge.database
      .from('messaging_sequences')
      .insert([seq])
      .select();
    if (error) throw error;
    return data![0];
  },

  async updateSequence(id: string, seq: Partial<MessagingSequence>): Promise<MessagingSequence> {
    const { data, error } = await insforge.database
      .from('messaging_sequences')
      .update({ ...seq, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },

  async deleteSequence(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('messaging_sequences')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addMessage(msg: Partial<Message>): Promise<Message> {
    const { data, error } = await insforge.database
      .from('messages')
      .insert([msg])
      .select();
    if (error) throw error;
    return data![0];
  },

  async updateMessage(id: string, msg: Partial<Message>): Promise<Message> {
    const { data, error } = await insforge.database
      .from('messages')
      .update({ ...msg, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data![0];
  },
};
