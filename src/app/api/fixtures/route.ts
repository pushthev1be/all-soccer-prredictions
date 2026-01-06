import { NextResponse } from "next/server";
import { SAMPLE_FIXTURES } from "@/lib/fixtures-sample";

export async function GET() {
  return NextResponse.json({ fixtures: SAMPLE_FIXTURES });
}
