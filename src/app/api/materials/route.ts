import { NextRequest, NextResponse } from "next/server";

import { ALL_MATERIALS, ENGINEERING_MATERIALS, MP_COMPOUNDS } from "@/data";
import { sourceCount } from "@/lib/material-display";

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope") ?? "all";

    if (scope === "stats") {
      return NextResponse.json({
        materialCount: ALL_MATERIALS.length,
        engineeringCount: ENGINEERING_MATERIALS.length,
        mpCount: MP_COMPOUNDS.length,
        totalSources: sourceCount(ALL_MATERIALS)
      });
    }

    if (scope === "engineering") {
      return NextResponse.json({ materials: ENGINEERING_MATERIALS });
    }

    return NextResponse.json({ materials: ALL_MATERIALS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load materials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
