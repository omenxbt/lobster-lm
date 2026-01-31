import { supabase } from './supabase';

// Get or create user
export async function getOrCreateUser(userId: string) {
  console.log('🔍 getOrCreateUser called with userId:', userId);
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();
  
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('❌ Error checking for existing user:', selectError);
  }
  
  if (existing) {
    console.log('✅ User exists, updating last_seen');
    await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
    return existing;
  }
  
  console.log('➕ Creating new user');
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ id: userId })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Error creating user:', insertError);
  } else {
    console.log('✅ User created:', newUser?.id);
  }
  
  return newUser;
}

// Create new conversation
export async function createConversation(userId: string) {
  console.log('🔍 createConversation called with userId:', userId);
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating conversation:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return null;
  }
  
  if (!data) {
    console.error('❌ createConversation returned null data!');
    return null;
  }
  
  if (!data.id) {
    console.error('❌ createConversation returned data but no id field!');
    console.error('❌ Data returned:', JSON.stringify(data, null, 2));
    return null;
  }
  
  console.log('✅ Conversation created successfully:', data.id);
  console.log('✅ Full conversation data:', JSON.stringify(data, null, 2));
  return data;
}

// Save a message
export async function saveMessage(
  conversationId: string, 
  role: 'user' | 'assistant', 
  content: string
) {
  console.log(`🔍 saveMessage called: conversationId=${conversationId}, role=${role}, content length=${content.length}`);
  const { error } = await supabase.from('messages').insert({ 
    conversation_id: conversationId, 
    role, 
    content 
  });
  
  if (error) {
    console.error('❌ Error saving message:', error);
    return;
  }
  
  console.log(`✅ Message saved: ${role} message (${content.length} chars)`);
}

// Get user's previous conversations with messages
export async function getPreviousConversations(userId: string, limit = 5) {
  console.log(`🔍 getPreviousConversations called: userId=${userId}, limit=${limit}`);
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, 
      created_at, 
      summary,
      messages (role, content, created_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error fetching previous conversations:', error);
    return [];
  }
  
  console.log(`✅ Found ${data?.length || 0} previous conversations`);
  return data || [];
}

// Build memory context string to inject into system prompt
export function buildMemoryContext(conversations: any[], currentConvoId?: string) {
  console.log(`🔍 buildMemoryContext called: ${conversations.length} conversations, currentConvoId=${currentConvoId}`);
  // Filter out current conversation
  const past = conversations.filter(c => c.id !== currentConvoId);
  
  console.log(`🔍 Filtered to ${past.length} past conversations`);
  
  if (!past || past.length === 0) {
    console.log('⚠️ No past conversations, returning empty memory context');
    return '';
  }
  
  const summaries = past.map(c => {
    const date = new Date(c.created_at);
    const ago = formatTimeAgo(date);
    
    // Get user messages as preview
    const userMsgs = (c.messages || [])
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .slice(0, 3)
      .join(' ')
      .slice(0, 200);
    
    if (c.summary) {
      return `${ago}: ${c.summary}`;
    }
    return `${ago}: User discussed: "${userMsgs}..."`;
  });

  return `
<previous_conversations>
You have spoken with this visitor before. Here's what you remember:

${summaries.join('\n\n')}

Reference these memories naturally when relevant. Don't say "according to my records" — just remember, like you naturally would.
</previous_conversations>`;
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  
  if (mins < 60) return 'Earlier today';
  if (hours < 24) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}
