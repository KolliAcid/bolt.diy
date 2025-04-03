import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (env: any) => {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_KEY) {
    console.error('Supabase credentials not found in environment variables');
    return null;
  }
  
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
};

export async function saveChat(supabase: any, userId: string, messages: any[]) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert({ 
        user_id: userId,
        messages: messages,
        updated_at: new Date()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) console.error('Error saving chat:', error);
    return data;
  } catch (e) {
    console.error('Exception when saving chat:', e);
    return null;
  }
}

export async function loadChat(supabase: any, userId: string) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('messages')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') console.error('Error loading chat:', error);
    return data?.messages || [];
  } catch (e) {
    console.error('Exception when loading chat:', e);
    return [];
  }
}
