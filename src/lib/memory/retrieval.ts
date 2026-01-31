// Memory retrieval functions

import type { RetrievedMemories, UserMemory } from './types';
import { getUserMemory, getGlobalFacts, getPersonality, getRecentMessages } from './storage';

export async function retrieveMemories(userId: string, message: string): Promise<RetrievedMemories> {
  // Get user memory
  let userMemory = getUserMemory(userId);
  if (!userMemory) {
    userMemory = {
      userId,
      preferences: {},
      firstSeen: new Date(),
      lastSeen: new Date(),
      totalConversations: 0,
      facts: [],
      relationshipLevel: 0,
      insideJokes: [],
      sharedExperiences: [],
      interests: [],
    };
  }
  
  // Simple keyword-based retrieval (will be replaced with semantic search)
  const messageLower = message.toLowerCase();
  
  // Filter user facts by relevance
  const relevantUserFacts = userMemory.facts.filter(fact => {
    const factLower = fact.fact.toLowerCase();
    return messageLower.split(' ').some(word => factLower.includes(word)) ||
           factLower.split(' ').some(word => messageLower.includes(word));
  }).slice(0, 10);
  
  // Filter global facts by relevance
  const globalFacts = getGlobalFacts();
  const relevantGlobalFacts = globalFacts.filter(fact => {
    const factLower = fact.fact.toLowerCase();
    return messageLower.split(' ').some(word => factLower.includes(word)) ||
           factLower.split(' ').some(word => messageLower.includes(word));
  }).slice(0, 10);
  
  // Get recent messages
  const recentMessages = getRecentMessages(userId, 20);
  
  // Get personality
  const personality = getPersonality();
  
  return {
    userFacts: relevantUserFacts,
    globalFacts: relevantGlobalFacts,
    userProfile: {
      userId: userMemory.userId,
      name: userMemory.name,
      totalConversations: userMemory.totalConversations,
      relationshipLevel: userMemory.relationshipLevel,
      preferences: userMemory.preferences,
      interests: userMemory.interests,
      preferredTone: userMemory.preferredTone,
    },
    recentMessages,
    personality: personality.slice(0, 10),
  };
}
