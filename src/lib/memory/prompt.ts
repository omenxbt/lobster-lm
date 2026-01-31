// Build prompt with memory context

import type { RetrievedMemories } from './types';

export function buildPromptWithMemory(message: string, memories: RetrievedMemories): string {
  const { userFacts, globalFacts, userProfile, recentMessages, personality } = memories;
  
  const memoryContext = `
<lobster_memory>
<user_profile>
User ID: ${userProfile.userId}
${userProfile.name ? `Name: ${userProfile.name}` : ''}
Relationship Level: ${userProfile.relationshipLevel}/100
Total Conversations: ${userProfile.totalConversations}
${userProfile.preferences && Object.keys(userProfile.preferences).length > 0 
  ? `Preferences: ${JSON.stringify(userProfile.preferences)}` 
  : ''}
${userProfile.interests && userProfile.interests.length > 0
  ? `Interests: ${userProfile.interests.join(', ')}`
  : ''}
${userProfile.preferredTone ? `Preferred Tone: ${userProfile.preferredTone}` : ''}
</user_profile>

<user_facts>
Things I know about this user:
${userFacts.length > 0 
  ? userFacts.map(f => `- ${f.fact} (confidence: ${f.confidence.toFixed(2)})`).join('\n')
  : '- No specific facts learned yet'}
</user_facts>

<global_knowledge>
Things I've learned from all my conversations:
${globalFacts.length > 0
  ? globalFacts.map(f => `- ${f.fact} (verified by ${f.verifiedBy} users, confidence: ${f.confidence.toFixed(2)})`).join('\n')
  : '- Still learning...'}
</global_knowledge>

<my_personality>
My evolved traits and opinions:
${personality.length > 0
  ? personality.map(p => `- ${p.topic}: ${p.opinion} (strength: ${p.strength.toFixed(2)})`).join('\n')
  : '- Personality still forming...'}
</my_personality>

<recent_context>
Recent messages in this conversation:
${recentMessages.length > 0
  ? recentMessages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')
  : '- This is the start of our conversation'}
</recent_context>
</lobster_memory>

Use this memory naturally in your response. Don't explicitly mention "my memory says" or "according to my memory" — just know these things like you naturally remember them. If you learn something new about the user or the world, incorporate it naturally so it can be extracted later.
`;

  return memoryContext;
}
