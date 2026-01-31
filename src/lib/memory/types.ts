// Memory system types

export interface UserMemory {
  userId: string;
  name?: string;
  preferences: Record<string, any>;
  firstSeen: Date;
  lastSeen: Date;
  totalConversations: number;
  facts: UserFact[];
  relationshipLevel: number; // 0-100
  insideJokes: string[];
  sharedExperiences: string[];
  preferredTone?: 'formal' | 'casual' | 'playful';
  interests: string[];
}

export interface UserFact {
  fact: string;
  confidence: number;
  source: 'stated' | 'inferred';
  timestamp: Date;
  category?: string;
  embedding?: number[];
}

export interface GlobalFact {
  fact: string;
  learnedFrom: string; // anonymized user reference
  confidence: number;
  verifiedBy: number;
  timestamp: Date;
  category?: string;
  embedding?: number[];
}

export interface Pattern {
  pattern: string;
  occurrences: number;
  examples: string[];
  category?: string;
}

export interface Opinion {
  topic: string;
  opinion: string;
  strength: number; // 0-1
  formedFrom: string[];
}

export interface EpisodicMemory {
  sessionId: string;
  userId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentTopic?: string;
  mood?: 'curious' | 'frustrated' | 'happy' | 'neutral';
  referencedMemories: string[];
}

export interface RetrievedMemories {
  userFacts: UserFact[];
  globalFacts: GlobalFact[];
  userProfile: Partial<UserMemory>;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  personality: Opinion[];
}

export interface LearningExtraction {
  userFacts: Array<{ fact: string; confidence: number; category?: string }>;
  globalFacts: Array<{ fact: string; confidence: number; category?: string }>;
  patterns: Array<{ pattern: string; category?: string }>;
  shouldUpdateRelationship: boolean;
  relationshipDelta: number;
}
