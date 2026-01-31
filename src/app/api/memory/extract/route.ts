// API route for learning extraction (server-side only)

import { NextRequest } from "next/server";
import { extractLearnings } from "@/lib/memory/learning";

export async function POST(req: NextRequest) {
  try {
    const { userId, userMessage, assistantResponse } = await req.json();

    if (!userId || !userMessage || !assistantResponse) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract learnings (this runs on server, so has access to env vars)
    await extractLearnings(userId, userMessage, assistantResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in learning extraction:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
