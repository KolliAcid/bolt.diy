import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (env: any) => {
  const supabaseUrl = env?.SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found in environment variables');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Save chat to Supabase
export async function saveChat(supabase: any, userId: string, messages: any[]) {
  if (!supabase) return null;
  
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
}

// Load chat from Supabase
export async function loadChat(supabase: any, userId: string) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('messages')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') console.error('Error loading chat:', error);
  return data?.messages || [];
}
