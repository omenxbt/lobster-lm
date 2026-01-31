# Lobster Persistent Memory System

## Overview

The Lobster Language Model now has a persistent memory system that:
- **Remembers everything** across sessions using localStorage (client-side)
- **Learns from every conversation** by extracting facts and patterns
- **Evolves over time** with personality traits and opinions
- **Knows each user uniquely** while sharing global knowledge

## Current Implementation

### Storage: localStorage (Client-Side)

Currently using browser localStorage for persistence. This means:
- ✅ Works immediately, no database setup needed
- ✅ Persists across sessions for the same browser
- ❌ Not shared across devices/browsers
- ❌ Limited storage capacity (~5-10MB)

### Memory Types

1. **User Memory** - Per-user facts, preferences, relationship level
2. **Global Facts** - Shared knowledge learned from all users
3. **Personality** - Lobster's evolved opinions and traits
4. **Conversation History** - Recent messages for context

## How It Works

### 1. User Identification

Users are identified by a unique ID stored in localStorage:
```typescript
import { getUserId } from '@/lib/memory/user';
const userId = getUserId(); // Returns or creates unique ID
```

### 2. Memory Retrieval

Before each chat, relevant memories are retrieved:
- User facts matching the message
- Global facts matching the message
- Recent conversation history
- User profile (relationship level, preferences)

### 3. Enhanced Prompt

Memories are injected into the Claude system prompt:
```
<lobster_memory>
  <user_profile>...</user_profile>
  <user_facts>...</user_facts>
  <global_knowledge>...</global_knowledge>
  <my_personality>...</my_personality>
  <recent_context>...</recent_context>
</lobster_memory>
```

### 4. Learning Extraction

After each response, Claude analyzes the conversation and extracts:
- New user facts (name, preferences, interests)
- Global facts (useful knowledge for all users)
- Patterns (interesting observations)
- Relationship changes (+/- relationship level)

## Upgrading to Database (Future)

When ready to upgrade to a real database:

### Option A: Supabase (Recommended)

1. **Set up Supabase project**
   ```bash
   # Install Supabase client
   npm install @supabase/supabase-js
   ```

2. **Enable pgvector extension**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Run migrations** (see `database/schema.sql`)

4. **Update environment variables**
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_KEY=xxx
   ```

5. **Replace storage functions** in `src/lib/memory/storage.ts` to use Supabase instead of localStorage

### Option B: PostgreSQL + pgvector

1. Set up PostgreSQL with pgvector
2. Create tables from schema
3. Update storage functions to use database queries
4. Add semantic search using vector embeddings

## Database Schema

See the full schema in the user's prompt. Key tables:
- `users` - User profiles
- `user_facts` - Per-user memory (with vector embeddings)
- `global_facts` - Shared knowledge (with vector embeddings)
- `conversations` - Conversation history
- `messages` - Individual messages
- `lobster_personality` - Evolved traits

## Vector Embeddings (Future Enhancement)

For semantic search, you'll need:
- OpenAI API key for embeddings (`text-embedding-3-small`)
- Or Voyage AI embeddings
- Vector similarity search using pgvector

## Testing the Memory System

1. **Start a conversation** - Ask about yourself
2. **Tell the lobster your name** - "My name is Alex"
3. **Mention interests** - "I work in crypto"
4. **Check localStorage** - Open DevTools → Application → Local Storage
5. **Start new conversation** - The lobster should remember!

## Memory Files

- `src/lib/memory/types.ts` - TypeScript interfaces
- `src/lib/memory/user.ts` - User identification
- `src/lib/memory/storage.ts` - Storage functions (localStorage)
- `src/lib/memory/retrieval.ts` - Memory retrieval logic
- `src/lib/memory/prompt.ts` - Prompt building with memory
- `src/lib/memory/learning.ts` - Learning extraction
- `src/app/api/memory/extract/route.ts` - Learning API endpoint

## Next Steps

1. ✅ Basic memory system (localStorage) - **DONE**
2. ⏳ Add semantic search (vector embeddings)
3. ⏳ Upgrade to Supabase/PostgreSQL
4. ⏳ Add personality evolution cron job
5. ⏳ Add memory visualization/debugging UI

🦞 From the depths, the Claw remembers all.
