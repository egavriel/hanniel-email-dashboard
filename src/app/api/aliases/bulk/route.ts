import { NextRequest, NextResponse } from "next/server";
import { getCFClient, getZoneId, getDestinationEmail, DOMAIN } from "@/lib/cloudflare";
import { upsertMetadata } from "@/lib/d1";
import type { CreateAliasInput } from "@/lib/types";

interface BulkResult {
  alias: string;
  success: boolean;
  error?: string;
  cfRuleId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: { aliases: CreateAliasInput[] } = await request.json();
    const { aliases } = body;

    if (!aliases || !Array.isArray(aliases) || aliases.length === 0) {
      return NextResponse.json({ error: "No aliases provided" }, { status: 400 });
    }

    if (aliases.length > 50) {
      return NextResponse.json({ error: "Maximum 50 aliases per batch" }, { status: 400 });
    }

    const cf = await getCFClient();
    const zoneId = await getZoneId();
    const destination = await getDestinationEmail();
    const results: BulkResult[] = [];

    for (const item of aliases) {
      try {
        if (!item.alias || !/^[a-z0-9][a-z0-9._-]*$/.test(item.alias)) {
          results.push({ alias: item.alias, success: false, error: "Invalid alias format" });
          continue;
        }

        const fullAddress = `${item.alias}@${DOMAIN}`;
        const rule = await cf.emailRouting.rules.create({
          zone_id: zoneId,
          name: item.alias,
          enabled: true,
          matchers: [{ type: "literal", field: "to", value: fullAddress }],
          actions: [{ type: "forward", value: [destination] }],
        });

        const ruleId = rule.id || "";
        await upsertMetadata(
          ruleId,
          item.alias,
          item.service || null,
          item.category || null,
          item.notes || null
        );

        results.push({ alias: item.alias, success: true, cfRuleId: ruleId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ alias: item.alias, success: false, error: message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      total: aliases.length,
      success: successCount,
      failed: aliases.length - successCount,
      results,
    });
  } catch (error) {
    console.error("Bulk create failed:", error);
    return NextResponse.json({ error: "Bulk create failed" }, { status: 500 });
  }
}
