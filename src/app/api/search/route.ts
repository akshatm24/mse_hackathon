import { NextRequest, NextResponse } from "next/server";

import { retrieveRelevantMaterials } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const results = await retrieveRelevantMaterials(query, 15);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
