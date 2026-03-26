import { NextResponse } from "next/server";
import { getCFClient, getZoneId } from "@/lib/cloudflare";

export async function GET() {
  try {
    const cf = await getCFClient();
    const zoneId = await getZoneId();

    const dns = await cf.emailRouting.dns.get({ zone_id: zoneId });

    return NextResponse.json(dns);
  } catch (error) {
    console.error("Failed to fetch DNS status:", error);
    return NextResponse.json({ error: "Failed to fetch DNS status" }, { status: 500 });
  }
}
