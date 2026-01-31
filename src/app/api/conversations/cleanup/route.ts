import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get all conversations with their message counts
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        id,
        messages (id)
      `);
    
    if (fetchError) {
      console.error('Error fetching conversations:', fetchError);
      return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
    
    // Find conversations with less than 10 messages
    const conversationsToDelete = conversations?.filter(conv => {
      const messageCount = conv.messages?.length || 0;
      return messageCount < 10;
    }) || [];
    
    if (conversationsToDelete.length === 0) {
      return Response.json({ 
        message: 'No conversations to clean up',
        deleted: 0 
      });
    }
    
    // Delete messages first (foreign key constraint)
    const conversationIds = conversationsToDelete.map(c => c.id);
    
    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);
    
    if (deleteMessagesError) {
      console.error('Error deleting messages:', deleteMessagesError);
      return Response.json({ error: 'Failed to delete messages' }, { status: 500 });
    }
    
    // Delete conversations
    const { error: deleteConvsError } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);
    
    if (deleteConvsError) {
      console.error('Error deleting conversations:', deleteConvsError);
      return Response.json({ error: 'Failed to delete conversations' }, { status: 500 });
    }
    
    return Response.json({ 
      message: `Deleted ${conversationsToDelete.length} conversations with less than 10 messages`,
      deleted: conversationsToDelete.length 
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
