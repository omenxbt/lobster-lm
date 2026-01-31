import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const mode = req.nextUrl.searchParams.get('mode') || 'personal'; // 'personal' or 'community'
  
  let query = supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      user_id,
      summary,
      messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .order('created_at', { ascending: false });
  
  if (mode === 'personal') {
    // Personal: only this user's conversations
    if (!userId) {
      return Response.json({ error: 'userId required for personal mode' }, { status: 400 });
    }
    query = query.eq('user_id', userId);
  } else {
    // Community: all conversations, limited
    query = query.limit(100);
  }
  
  const { data: conversations, error } = await query;
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
  
  // Format conversations with preview and filter out conversations with less than 10 messages
  const formatted = conversations
    ?.filter(conv => (conv.messages?.length || 0) >= 10) // Only include conversations with 10+ messages
    .map(conv => ({
      id: conv.id,
      created_at: conv.created_at,
      user_id: conv.user_id, // Include user_id for smart labeling
      summary: conv.summary,
      message_count: conv.messages?.length || 0,
      preview: conv.messages?.find(m => m.role === 'user')?.content?.slice(0, 100) || 'Empty conversation',
      messages: conv.messages?.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })) || [];
  
  return Response.json({ conversations: formatted });
}
