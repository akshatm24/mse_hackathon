import { NextRequest, NextResponse } from "next/server";

import { generateNovelPredictionExplanation } from "@/lib/gemini";
import {
  fallbackNovelPredictionExplanation,
  predictNovelMaterial
} from "@/lib/novel-alloy";

async function buildPredictionResponse(composition: string) {
  const prediction = predictNovelMaterial(composition);
  let explanation = "";

  try {
    explanation = await generateNovelPredictionExplanation(composition, prediction);
  } catch {
    explanation = fallbackNovelPredictionExplanation(composition, prediction);
  }

  return {
    ...prediction,
    explanation
  };
}

export async function GET(req: NextRequest) {
  try {
    const composition = req.nextUrl.searchParams.get("composition");

    if (!composition) {
      return NextResponse.json({ error: "composition is required" }, { status: 400 });
    }

    return NextResponse.json(await buildPredictionResponse(composition));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { composition?: string };

    if (!body.composition || typeof body.composition !== "string") {
      return NextResponse.json({ error: "composition is required" }, { status: 400 });
    }

    return NextResponse.json(await buildPredictionResponse(body.composition));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
