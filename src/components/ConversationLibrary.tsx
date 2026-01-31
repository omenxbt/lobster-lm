'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  created_at: string;
  user_id: string; // Add user_id for smart labeling
  summary: string | null;
  message_count: number;
  preview: string;
  messages: Message[];
}

interface Props {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversationId: string, messages: Message[]) => void;
}

export default function ConversationLibrary({ userId, isOpen, onClose, onSelectConversation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'personal' | 'community'>('personal');
  
  const fetchConversations = async () => {
    if (!userId && mode === 'personal') return;
    setLoading(true);
    
    try {
      const url = mode === 'personal' 
        ? `/api/conversations?userId=${userId}&mode=personal`
        : `/api/conversations?mode=community`;
      
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, mode, userId]);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  // Check if this conversation belongs to current user
  const isOwnConversation = selectedConvo?.user_id === userId;
  
  // Generate anonymized label for other users
  const getVisitorLabel = (visitorUserId: string) => {
    return `Visitor #${visitorUserId.slice(-4).toUpperCase()}`;
  };
  
  // Determine user label
  const userLabel = isOwnConversation 
    ? 'YOU' 
    : selectedConvo?.user_id 
      ? getVisitorLabel(selectedConvo.user_id)
      : 'User';
  
  // Generate conversation name
  const getConversationName = (conv: Conversation) => {
    const shortId = conv.id.slice(0, 4);
    const firstUserMsg = conv.messages?.find(m => m.role === 'user')?.content || '';
    const words = firstUserMsg
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
    return `conversation_${shortId}_${words || 'empty'}`;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">
      <div className="bg-[#0d0d0f] border border-[#3d3a34] rounded-lg w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3d3a34]">
          <h2 className="text-[#c94a4a] font-serif text-2xl" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            📜 Conversation Archives
          </h2>
          <button
            onClick={onClose}
            className="text-[#6a6560] hover:text-[#c94a4a] transition-colors text-xl w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[#3d3a34]">
          <button
            onClick={() => setMode('personal')}
            className={`font-mono text-sm px-3 py-1 rounded transition-colors ${
              mode === 'personal' 
                ? 'bg-[#2a2620] text-[#c4b5a0]' 
                : 'text-[#6a6560] hover:text-[#c4b5a0]'
            }`}
          >
            📁 My Archives
          </button>
          <button
            onClick={() => setMode('community')}
            className={`font-mono text-sm px-3 py-1 rounded transition-colors ${
              mode === 'community' 
                ? 'bg-[#2a2620] text-[#c4b5a0]' 
                : 'text-[#6a6560] hover:text-[#c4b5a0]'
            }`}
          >
            🌐 Community Archives
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation List */}
          <div className="w-2/5 border-r border-[#3d3a34] overflow-y-auto bg-[#0a0a0c]">
            {loading ? (
              <div className="p-6 text-[#6a6560] font-serif text-base italic">
                Loading archives...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-[#6a6560] font-serif text-base italic">
                {mode === 'personal' 
                  ? "No conversations yet. Start talking to the lobster!"
                  : "No community conversations yet."
                }
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvo(conv)}
                  className={`py-4 px-5 border-b border-[#3d3a34] cursor-pointer transition-colors ${
                    selectedConvo?.id === conv.id 
                      ? 'bg-[#1a1814] border-l-2 border-[#c94a4a]' 
                      : 'hover:bg-[#151412]'
                  }`}
                >
                  <div className="mb-2">
                    <div className="text-[#8a8580] font-mono text-sm mb-1">
                      {getConversationName(conv)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#8a8580] font-serif text-sm">
                      {formatDate(conv.created_at)}
                    </span>
                    <span className="text-[#6a6560] font-serif text-sm">
                      {conv.message_count} msgs
                    </span>
                  </div>
                  <p className="text-[#e8e4e0] font-serif text-base line-clamp-2 leading-relaxed">
                    {conv.preview}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Conversation View */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c]">
            {selectedConvo ? (
              <div className="space-y-5">
                <div className="pb-4 mb-6 border-b border-[#3d3a34]">
                  <div className="mb-2">
                    <div className="text-[#8a8580] font-mono text-base">
                      {getConversationName(selectedConvo)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6a6560] font-serif text-base italic">
                      {new Date(selectedConvo.created_at).toLocaleString()}
                    </span>
                    {onSelectConversation && isOwnConversation && (
                      <button
                        onClick={() => onSelectConversation(selectedConvo.id, selectedConvo.messages)}
                        className="text-[#c94a4a] font-serif text-base border border-[#c94a4a]/30 px-4 py-2 rounded hover:bg-[#c94a4a]/10 transition-colors"
                      >
                        Continue this conversation →
                      </button>
                    )}
                  </div>
                </div>
                
                {selectedConvo.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-lg mb-5 ${
                      msg.role === 'user'
                        ? 'bg-[#1a1814]/50 ml-12 border-l-2 border-[#3d3a34]'
                        : 'bg-[#0d0d0f] mr-12 border-l-2 border-[#c94a4a]'
                    }`}
                  >
                    <div className="text-[#c94a4a] font-serif text-sm mb-3 uppercase tracking-wider">
                      {msg.role === 'user' 
                        ? (isOwnConversation ? 'YOU' : getVisitorLabel(selectedConvo?.user_id || ''))
                        : '🦞 The Oracle'
                      }
                    </div>
                    <div className="text-[#e8e4e0] font-serif text-base whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#6a6560] font-serif italic">
                Select a conversation to view
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
