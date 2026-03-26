import { NextRequest, NextResponse } from "next/server";
import { getCFClient, ZONE_ID, DESTINATION_EMAIL, DOMAIN } from "@/lib/cloudflare";
import { upsertMetadata, deleteMetadata, getMetadataByRuleId } from "@/lib/d1";
import type { UpdateAliasInput } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateAliasInput = await request.json();

    const cf = getCFClient();
    const zoneId = ZONE_ID();

    // If toggling enabled state, update the CF rule
    if (body.enabled !== undefined) {
      const meta = await getMetadataByRuleId(id);
      const alias = meta?.alias || "";
      const fullAddress = `${alias}@${DOMAIN}`;

      await cf.emailRouting.rules.update(id, {
        zone_id: zoneId,
        enabled: body.enabled,
        matchers: [{ type: "literal", field: "to", value: fullAddress }],
        actions: [{ type: "forward", value: [DESTINATION_EMAIL()] }],
      });
    }

    // Update metadata if provided
    if (body.service !== undefined || body.category !== undefined || body.notes !== undefined) {
      const existing = await getMetadataByRuleId(id);
      if (existing) {
        await upsertMetadata(
          id,
          existing.alias,
          body.service ?? existing.service,
          body.category ?? existing.category,
          body.notes ?? existing.notes
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update alias:", error);
    return NextResponse.json({ error: "Failed to update alias" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cf = getCFClient();
    const zoneId = ZONE_ID();

    await cf.emailRouting.rules.delete(id, { zone_id: zoneId });
    await deleteMetadata(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete alias:", error);
    return NextResponse.json({ error: "Failed to delete alias" }, { status: 500 });
  }
}
