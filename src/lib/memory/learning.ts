// Learning extraction from conversations

import Anthropic from "@anthropic-ai/sdk";
import type { LearningExtraction } from './types';
import { addUserFact, addGlobalFact, addOpinion, getUserMemory, saveUserMemory } from './storage';
import type { UserFact, GlobalFact } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function extractLearnings(
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured, skipping learning extraction');
    return;
  }

  try {
    const extractionPrompt = `
Analyze this conversation exchange and extract any new information worth remembering.

User message: "${userMessage}"
Assistant response: "${assistantResponse}"

Extract:
1. USER_FACTS: New facts about THIS specific user (name, preferences, interests, work, etc.)
2. GLOBAL_FACTS: General knowledge/facts that would be useful to know for ALL users
3. PATTERNS: Any interesting patterns or insights
4. RELATIONSHIP: Whether this interaction should affect relationship level (-10 to +10)

Respond in JSON format:
{
  "userFacts": [
    { "fact": "clear statement of fact", "confidence": 0.0-1.0, "category": "optional category" }
  ],
  "globalFacts": [
    { "fact": "general knowledge fact", "confidence": 0.0-1.0, "category": "optional category" }
  ],
  "patterns": [
    { "pattern": "observed pattern", "category": "optional category" }
  ],
  "shouldUpdateRelationship": true/false,
  "relationshipDelta": -10 to 10
}

Only extract genuinely useful information. Be selective. Return empty arrays if nothing notable.
Don't extract obvious things or things already stated. Focus on:
- User's name, preferences, interests, work, background
- Technical facts, patterns, or insights
- Things that would help in future conversations

Return ONLY valid JSON, no other text.
`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      console.warn('Unexpected response type from learning extraction');
      return;
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in learning extraction response');
      return;
    }

    const learnings: LearningExtraction = JSON.parse(jsonMatch[0]);

    // Note: Storage functions handle client/server-side checks
    // On server-side, these will be no-ops (localStorage not available)
    // In production with database, these would write to DB
    
    // Store user facts
    for (const fact of learnings.userFacts || []) {
      const userFact: UserFact = {
        fact: fact.fact,
        confidence: fact.confidence || 0.8,
        source: 'inferred',
        timestamp: new Date(),
        category: fact.category,
      };
      addUserFact(userId, userFact);
    }

    // Store global facts
    for (const fact of learnings.globalFacts || []) {
      const globalFact: GlobalFact = {
        fact: fact.fact,
        learnedFrom: userId,
        confidence: fact.confidence || 0.5,
        verifiedBy: 1,
        timestamp: new Date(),
        category: fact.category,
      };
      addGlobalFact(globalFact);
    }

    // Update relationship level
    if (learnings.shouldUpdateRelationship && learnings.relationshipDelta) {
      const memory = getUserMemory(userId);
      if (memory) {
        memory.relationshipLevel = Math.max(0, Math.min(100, 
          memory.relationshipLevel + learnings.relationshipDelta
        ));
        memory.totalConversations += 1;
        memory.lastSeen = new Date();
        saveUserMemory(memory);
      }
    }
    
    // Log for debugging (will show in server logs)
    console.log(`[Memory] Extracted ${learnings.userFacts?.length || 0} user facts, ${learnings.globalFacts?.length || 0} global facts for user ${userId}`);

    console.log(`Extracted ${learnings.userFacts?.length || 0} user facts, ${learnings.globalFacts?.length || 0} global facts`);
  } catch (error) {
    console.error('Error extracting learnings:', error);
    // Don't throw - learning extraction shouldn't break the chat
  }
}
