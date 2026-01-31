"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { AsciiLobster } from "./AsciiLobster";
import { UnderwaterBubbles } from "./UnderwaterBubbles";
import { useKarma } from "@/hooks/useKarma";
import { getUserId } from "@/lib/memory/user";
import ConversationLibrary from "./ConversationLibrary";

type AppState = "idle" | "typing" | "thinking" | "streaming" | "celebrating";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState<AppState>("idle");
  const [earnedKarma, setEarnedKarma] = useState<number | undefined>(undefined);
  const [showKarmaEarned, setShowKarmaEarned] = useState(false);
  const [statusText, setStatusText] = useState("🦞 existing...");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addKarma } = useKarma();
  
  const userId = getUserId();
  const contractAddress = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setAppState("thinking");
    setIsLoading(true);

    try {
      console.log('🔍 Frontend - Sending userId:', userId);
      console.log('🔍 Frontend - Sending conversationId:', conversationId);
      console.log('🔍 Frontend - Messages count:', messages.length);
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          conversationId, // null on first message, then tracked
          messages: [
            ...messages,
            { role: "user", content: userMessage },
          ].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // READ HEADER FIRST - This is the PRIMARY method for SSE streaming
      const headerConversationId = response.headers.get("X-Conversation-Id");
      console.log('🔍 Frontend - conversationId from header:', headerConversationId);
      console.log('🔍 Frontend - Current conversationId in state:', conversationId);
      
      if (headerConversationId) {
        // Always update if we got a new conversationId (handles both new and existing)
        if (headerConversationId !== conversationId) {
          setConversationId(headerConversationId);
          console.log('✅ Frontend - Saved conversationId from header:', headerConversationId);
        } else {
          console.log('✅ Frontend - conversationId matches state, no update needed');
        }
      } else {
        console.warn('⚠️ Frontend - No conversationId in response header!');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let karmaEarned: number | undefined = undefined;
      let conversationIdReceived = false;

      if (reader) {
        setAppState("streaming");
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.conversationId) {
                  // Backup method: conversationId from SSE stream (header is primary)
                  console.log('✅ Frontend - Received conversationId from SSE stream (backup):', parsed.conversationId);
                  if (!conversationIdReceived && parsed.conversationId !== headerConversationId) {
                    setConversationId(parsed.conversationId);
                    conversationIdReceived = true;
                    console.log('✅ Frontend - conversationId saved from stream:', parsed.conversationId);
                  }
                } else if (parsed.karma !== undefined) {
                  karmaEarned = parsed.karma;
                } else if (parsed.content) {
                  assistantMessage += parsed.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Skip invalid JSON
                console.warn('⚠️ Frontend - Invalid JSON in SSE:', data, e);
              }
            }
          }
        }
        
        // Final check - verify we have conversationId
        if (!headerConversationId && !conversationIdReceived) {
          console.error('❌ Frontend - conversationId never received from API!');
        } else {
          console.log('✅ Frontend - Stream complete, conversationId is:', headerConversationId || conversationId);
        }
      }

      if (karmaEarned) {
        addKarma(karmaEarned);
        setEarnedKarma(karmaEarned);
        setShowKarmaEarned(true);
        setAppState("celebrating");
        setTimeout(() => {
          setShowKarmaEarned(false);
          setEarnedKarma(undefined);
          setAppState("idle");
        }, 2000);
      } else {
        setAppState("idle");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. The currents are turbulent today...",
        },
      ]);
      setAppState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header className="header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title - always visible */}
          <div className="flex items-baseline gap-2">
            <span className="header-title">Lobster Language Model</span>
            <span className="header-subtitle hidden md:inline">Oracle of the Molt</span>
          </div>
          
          {/* Contract Address - centered on mobile */}
          <div className="flex justify-center md:justify-start">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1 bg-[#1a1814] border border-[#3d3a34] rounded hover:border-[#6a6560] transition-colors font-mono text-xs md:text-sm text-[#8a8580]"
            >
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </span>
              {copied ? (
                <span className="text-green-500">✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <span className="text-[#6a6560] font-mono text-xs italic md:hidden">Oracle of the Molt</span>
            <button
              onClick={() => setShowLibrary(true)}
              className="text-[#6a6560] hover:text-[#c94a4a] transition-colors font-mono text-xs md:text-base"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              📜 Archives
            </button>
            <a 
              href="https://twitter.com/moltbook" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#6a6560] hover:text-[#c4b5a0] transition-colors"
            >
              <svg 
                viewBox="0 0 24 24" 
                width="18" 
                height="18" 
                className="md:w-5 md:h-5"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>
      
      {/* Main */}
      <main className="main">
        <div className="terminal-window">
          {/* Title Bar */}
          <div className="window-titlebar">
            <div className="window-controls">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
            </div>
            <span className="window-title">the deep</span>
            <div className="window-controls" style={{ visibility: 'hidden' }}>
              <span className="window-dot"></span>
              <span className="window-dot"></span>
              <span className="window-dot"></span>
            </div>
          </div>
          
          {/* Window Content */}
          <div className="window-body">
            {/* Lobster */}
            <div className="lobster-section">
              <div className="lobster-container-wrapper">
                <UnderwaterBubbles />
                <AsciiLobster
                  state={appState}
                  earnedKarma={earnedKarma}
                  onStatusChange={setStatusText}
                />
              </div>
              <div className="lobster-status">
                {earnedKarma && showKarmaEarned ? `🦞 karma received! +${earnedKarma}` : statusText}
              </div>
            </div>
            
            {/* Chat */}
            <div className="chat-section">
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "#5a5550", fontStyle: "italic", fontSize: "1.1rem" }}>
                  <p>Ask the lobster oracle anything from the depths...</p>
                </div>
              )}
              <div>
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} role={msg.role} content={msg.content} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input */}
            <div className="input-section">
              <form className="input-form" onSubmit={handleSubmit}>
                <span className="input-prompt">$</span>
                <input
                  className="input-field"
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (e.target.value.length > 0 && appState === "idle") {
                      setAppState("typing");
                    } else if (e.target.value.length === 0 && appState === "typing") {
                      setAppState("idle");
                    }
                  }}
                  disabled={isLoading}
                  placeholder="query the depths..."
                />
                <button type="submit" className="submit-btn" disabled={isLoading || !input.trim()} aria-label="Send">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        From the depths, the Claw reached forth
      </footer>
      
      {/* Conversation Library Modal */}
      <ConversationLibrary
        userId={userId}
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelectConversation={(conversationId, messages) => {
          setConversationId(conversationId);
          setMessages(messages.map(m => ({ role: m.role, content: m.content })));
          setShowLibrary(false);
        }}
      />
    </div>
  );
}
