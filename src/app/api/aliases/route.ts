import { NextRequest, NextResponse } from "next/server";
import { getCFClient, getZoneId, getDestinationEmail, DOMAIN } from "@/lib/cloudflare";
import { getAllMetadata, upsertMetadata } from "@/lib/d1";
import type { AliasRecord, CreateAliasInput } from "@/lib/types";

export async function GET() {
  try {
    const cf = await getCFClient();
    const zoneId = await getZoneId();

    const [metadataList, rulesPages] = await Promise.all([
      getAllMetadata(),
      (async () => {
        const rules = [];
        for await (const rule of cf.emailRouting.rules.list({ zone_id: zoneId })) {
          rules.push(rule);
        }
        return rules;
      })(),
    ]);

    const metadataMap = new Map(metadataList.map((m) => [m.cf_rule_id, m]));

    const aliases: AliasRecord[] = rulesPages.map((rule) => {
      const matcher = rule.matchers?.[0];
      const action = rule.actions?.[0];
      const address = matcher?.value || "";
      const alias = address.split("@")[0] || "";
      const meta = metadataMap.get(rule.id || "");

      return {
        cfRuleId: rule.id || "",
        alias,
        fullAddress: address,
        destination: action?.value?.join(", ") || "",
        enabled: rule.enabled !== false,
        priority: 0,
        service: meta?.service ?? null,
        category: meta?.category ?? null,
        notes: meta?.notes ?? null,
        createdAt: meta?.created_at ?? null,
        updatedAt: meta?.updated_at ?? null,
        tracked: !!meta,
      };
    });

    return NextResponse.json(aliases);
  } catch (error) {
    console.error("Failed to list aliases:", error);
    return NextResponse.json(
      { error: "Failed to list aliases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAliasInput = await request.json();
    const { alias, service, category, notes } = body;

    if (!alias || !/^[a-z0-9][a-z0-9._-]*$/.test(alias)) {
      return NextResponse.json(
        { error: "Invalid alias. Use lowercase letters, numbers, dots, hyphens, underscores." },
        { status: 400 }
      );
    }

    const cf = await getCFClient();
    const zoneId = await getZoneId();
    const destination = await getDestinationEmail();
    const fullAddress = `${alias}@${DOMAIN}`;

    const rule = await cf.emailRouting.rules.create({
      zone_id: zoneId,
      name: alias,
      enabled: true,
      matchers: [{ type: "literal", field: "to", value: fullAddress }],
      actions: [{ type: "forward", value: [destination] }],
    });

    const ruleId = rule.id || "";
    await upsertMetadata(ruleId, alias, service || null, category || null, notes || null);

    return NextResponse.json({
      cfRuleId: ruleId,
      alias,
      fullAddress,
      destination,
      enabled: true,
      service: service || null,
      category: category || null,
      notes: notes || null,
    });
  } catch (error) {
    console.error("Failed to create alias:", error);
    const message = error instanceof Error ? error.message : "Failed to create alias";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
