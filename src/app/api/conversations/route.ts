import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }
  
  // Get all conversations for this user
  const { data: conversations, error } = await supabase
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
  
  // Format conversations with preview
  const formatted = conversations?.map(conv => ({
    id: conv.id,
    created_at: conv.created_at,
    user_id: conv.user_id, // Include user_id for smart labeling
    summary: conv.summary,
    message_count: conv.messages?.length || 0,
    preview: conv.messages?.find(m => m.role === 'user')?.content?.slice(0, 100) || 'Empty conversation',
    messages: conv.messages?.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }));
  
  return Response.json({ conversations: formatted || [] });
}
