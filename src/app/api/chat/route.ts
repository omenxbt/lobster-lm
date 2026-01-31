import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, generateKarmaReward } from "@/lib/constants";
import { getOrCreateUser, createConversation, saveMessage, getPreviousConversations, buildMemoryContext } from "@/lib/memory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, conversationId: existingConvoId } = await req.json();

    console.log('🔍 API Route - userId received:', userId);
    console.log('🔍 API Route - conversationId received:', existingConvoId);
    console.log('🔍 API Route - messages count:', messages.length);

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure we have a userId
    if (!userId) {
      console.error('❌ API Route - No userId provided!');
      return new Response(
        JSON.stringify({ error: "userId required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate karma reward (will be sent at the end)
    const karmaReward = generateKarmaReward();

    // Get or create user
    await getOrCreateUser(userId);
    
    // Get or create conversation BEFORE streaming
    let currentConversationId = existingConvoId;
    if (!currentConversationId) {
      console.log('🔍 API Route - Creating new conversation for userId:', userId);
      const convo = await createConversation(userId);
      console.log('🔍 API Route - createConversation returned:', convo);
      console.log('🔍 API Route - convo?.id:', convo?.id);
      currentConversationId = convo?.id;
      console.log('🔍 API Route - New conversationId assigned:', currentConversationId);
      console.log('🔍 API Route - Type of conversationId:', typeof currentConversationId);
    } else {
      console.log('🔍 API Route - Using existing conversationId:', currentConversationId);
    }
    
    // CRITICAL CHECK: Verify conversationId exists before proceeding
    if (!currentConversationId) {
      console.error('❌ API Route - FATAL: conversationId is still null/undefined after createConversation!');
      console.error('❌ API Route - This means createConversation failed or returned null');
    }
    
    // Get previous conversations for memory context BEFORE streaming
    const previousConversations = await getPreviousConversations(userId, 6);
    console.log('🔍 API Route - Previous conversations found:', previousConversations.length);
    
    const memoryContext = buildMemoryContext(previousConversations, currentConversationId);
    console.log('🔍 API Route - Memory context length:', memoryContext.length);
    console.log('🔍 API Route - Memory context preview:', memoryContext.slice(0, 200));
    
    // Get the latest user message
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
    
    // Save user message to database BEFORE streaming
    if (currentConversationId && lastUserMessage) {
      await saveMessage(currentConversationId, 'user', lastUserMessage);
      console.log('✅ API Route - User message saved before streaming');
    }
    
    // Build system prompt with memory injected
    const enhancedSystemPrompt = `${SYSTEM_PROMPT}

${memoryContext}`;
    
    console.log('=== FULL SYSTEM PROMPT ===');
    console.log('Length:', enhancedSystemPrompt.length);
    console.log('Contains memory context:', enhancedSystemPrompt.includes('<previous_conversations>'));
    console.log('=== END SYSTEM PROMPT ===');

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAssistantResponse = "";

        try {
          // Send conversationId FIRST via SSE (backup method)
          if (currentConversationId) {
            const convoData = JSON.stringify({ conversationId: currentConversationId });
            controller.enqueue(encoder.encode(`data: ${convoData}\n\n`));
            console.log('✅ API - conversationId sent in SSE stream:', currentConversationId);
          }

          const anthropicStream = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: enhancedSystemPrompt,
            messages: messages.map((msg: { role: string; content: string }) => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
            })),
            stream: true,
          });

          // Stream Claude's response and collect full text
          for await (const chunk of anthropicStream) {
            if (chunk.type === "content_block_delta" && "text" in chunk.delta) {
              const text = chunk.delta.text || "";
              if (text) {
                fullAssistantResponse += text;
                const data = JSON.stringify({ content: text });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }

          // Save assistant response to database AFTER stream completes
          if (currentConversationId && fullAssistantResponse) {
            await saveMessage(currentConversationId, 'assistant', fullAssistantResponse);
            console.log('✅ API - Assistant message saved after streaming, length:', fullAssistantResponse.length);
          } else {
            console.warn('⚠️ API - Could not save assistant message:', {
              hasConversationId: !!currentConversationId,
              hasResponse: !!fullAssistantResponse,
              responseLength: fullAssistantResponse.length
            });
          }

          // Send karma reward at the end
          const karmaData = JSON.stringify({ karma: karmaReward });
          controller.enqueue(encoder.encode(`data: ${karmaData}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Error streaming response:", error);
          controller.error(error);
        }
      },
    });

    // Send conversationId as response header (PRIMARY METHOD for SSE)
    // CRITICAL: Always include the header, even if empty
    console.log('🔍 API - About to create headers object');
    console.log('🔍 API - currentConversationId value:', currentConversationId);
    console.log('🔍 API - currentConversationId type:', typeof currentConversationId);
    console.log('🔍 API - currentConversationId truthy?', !!currentConversationId);
    
    const headers: HeadersInit = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Conversation-Id": currentConversationId || "", // Always include, even if empty
    };
    
    console.log('🔍 API - Headers object created');
    console.log('🔍 API - headers["X-Conversation-Id"]:', headers["X-Conversation-Id"]);
    console.log('🔍 API - All headers:', JSON.stringify(headers, null, 2));
    
    if (!currentConversationId) {
      console.error('❌ API - WARNING: conversationId is null/undefined! Header will be empty string.');
      console.error('❌ API - This will cause memory to not work!');
    } else {
      console.log('✅ API - conversationId successfully set in header:', currentConversationId);
    }
    
    console.log('🔍 API - About to return Response with headers');
    return new Response(stream, { headers });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
