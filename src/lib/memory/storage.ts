// In-memory storage (will be replaced with database)
// For now, using localStorage for persistence

import type { UserMemory, UserFact, GlobalFact, Opinion, RetrievedMemories } from './types';

const STORAGE_KEYS = {
  USER_MEMORY: 'lobster_user_memory',
  GLOBAL_FACTS: 'lobster_global_facts',
  PERSONALITY: 'lobster_personality',
  CONVERSATIONS: 'lobster_conversations',
};

// User Memory Storage
export function getUserMemory(userId: string): UserMemory | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(`${STORAGE_KEYS.USER_MEMORY}_${userId}`);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      firstSeen: new Date(parsed.firstSeen),
      lastSeen: new Date(parsed.lastSeen),
      facts: parsed.facts.map((f: any) => ({
        ...f,
        timestamp: new Date(f.timestamp),
      })),
    };
  } catch {
    return null;
  }
}

export function saveUserMemory(memory: UserMemory): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(
    `${STORAGE_KEYS.USER_MEMORY}_${memory.userId}`,
    JSON.stringify(memory)
  );
}

export function createUserMemory(userId: string): UserMemory {
  const now = new Date();
  return {
    userId,
    preferences: {},
    firstSeen: now,
    lastSeen: now,
    totalConversations: 0,
    facts: [],
    relationshipLevel: 0,
    insideJokes: [],
    sharedExperiences: [],
    interests: [],
  };
}

export function addUserFact(userId: string, fact: UserFact): void {
  const memory = getUserMemory(userId) || createUserMemory(userId);
  memory.facts.push(fact);
  memory.lastSeen = new Date();
  saveUserMemory(memory);
}

// Global Facts Storage
export function getGlobalFacts(): GlobalFact[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_FACTS);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((f: any) => ({
      ...f,
      timestamp: new Date(f.timestamp),
    }));
  } catch {
    return [];
  }
}

export function addGlobalFact(fact: GlobalFact): void {
  const facts = getGlobalFacts();
  
  // Check for similar facts (simple string matching for now)
  const similar = facts.find(f => 
    f.fact.toLowerCase() === fact.fact.toLowerCase() ||
    f.fact.includes(fact.fact) || fact.fact.includes(f.fact)
  );
  
  if (similar) {
    // Increment verification count
    similar.verifiedBy += 1;
    similar.confidence = Math.min(1, similar.confidence + 0.1);
  } else {
    facts.push(fact);
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_FACTS, JSON.stringify(facts));
  }
}

// Personality/Opinions Storage
export function getPersonality(): Opinion[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONALITY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addOpinion(opinion: Opinion): void {
  const personality = getPersonality();
  const existing = personality.find(p => p.topic === opinion.topic);
  
  if (existing) {
    // Update existing opinion
    existing.opinion = opinion.opinion;
    existing.strength = Math.min(1, existing.strength + 0.1);
    existing.formedFrom.push(...opinion.formedFrom);
  } else {
    personality.push(opinion);
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PERSONALITY, JSON.stringify(personality));
  }
}

// Conversation History
export function saveConversation(userId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): void {
  if (typeof window === 'undefined') return;
  
  const key = `${STORAGE_KEYS.CONVERSATIONS}_${userId}`;
  const stored = localStorage.getItem(key);
  const conversations = stored ? JSON.parse(stored) : [];
  
  conversations.push({
    sessionId: `session-${Date.now()}`,
    userId,
    messages,
    timestamp: new Date().toISOString(),
  });
  
  // Keep only last 10 conversations
  const recent = conversations.slice(-10);
  localStorage.setItem(key, JSON.stringify(recent));
}

export function getRecentMessages(userId: string, limit: number = 20): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (typeof window === 'undefined') return [];
  
  const key = `${STORAGE_KEYS.CONVERSATIONS}_${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    const conversations = JSON.parse(stored);
    const allMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    for (const conv of conversations.slice(-3)) { // Last 3 conversations
      allMessages.push(...conv.messages);
    }
    
    return allMessages.slice(-limit);
  } catch {
    return [];
  }
}
