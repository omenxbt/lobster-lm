import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      summary,
      messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .eq('id', conversationId)
    .single();
  
  if (error) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }
  
  // Sort messages by time
  if (data.messages) {
    data.messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  
  return Response.json({ conversation: data });
}
