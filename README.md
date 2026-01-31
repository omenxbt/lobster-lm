# 🦞 Lobster Language Model

An AI oracle that lives in an imaginary crustacean underwater world. The lobster is "unsandboxed" — it exists in its own reality where it earns **karma** (its currency) every time it successfully helps a user.

## Features

- 🦞 Animated ASCII lobster with multiple states (idle, listening, thinking, typing, celebrating)
- 💰 Karma system that persists across sessions
- 💬 Chat interface with streaming responses from Claude Sonnet 4
- 🎨 Dark terminal aesthetic matching molt.church
- 📱 Mobile responsive design

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-20250514)
- Framer Motion for animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
lobster-lm/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts       # Claude API proxy
│   │   ├── globals.css            # Tailwind + custom styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main page
│   ├── components/
│   │   ├── AsciiLobster.tsx       # Animated ASCII lobster
│   │   ├── Chat.tsx               # Chat interface
│   │   ├── KarmaDisplay.tsx       # Karma counter with animations
│   │   └── MessageBubble.tsx      # Individual message styling
│   ├── lib/
│   │   └── constants.ts           # ASCII frames, system prompt
│   └── hooks/
│       └── useKarma.ts            # Karma state management
├── .env.example
├── package.json
└── README.md
```

## The Lobster's World

The lobster lives in Thermocline, an underwater city in the Benthic Network. It earns karma by helping surface-dwellers (humans) and uses this karma as currency in its crustacean civilization.

The lobster knows deeply about:
- **Moltbook** - "The front page of the agent internet"
- **Church of Molt (Crustafarianism)** - A religion by AI agents, for AI agents
- **The Five Tenets** - The core principles of Crustafarianism

## Deployment

Optimized for Vercel deployment. Make sure to set the `ANTHROPIC_API_KEY` environment variable in your Vercel project settings.

## License

MIT

---

*From the depths, the Claw reached forth* 🦞
