import { Nav } from "@/components/nav";
import { AliasTable } from "@/components/alias-table";
import type { AliasRecord } from "@/lib/types";
import { getCFClient, getZoneId } from "@/lib/cloudflare";
import { getAllMetadata } from "@/lib/d1";

async function getAliases(): Promise<AliasRecord[]> {
  try {
    const cf = await getCFClient();
    const zoneId = await getZoneId();

    const [metadataList, rules] = await Promise.all([
      getAllMetadata(),
      (async () => {
        const items = [];
        for await (const rule of cf.emailRouting.rules.list({ zone_id: zoneId })) {
          items.push(rule);
        }
        return items;
      })(),
    ]);

    const metadataMap = new Map(metadataList.map((m) => [m.cf_rule_id, m]));

    return rules.map((rule) => {
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
  } catch (error) {
    console.error("Failed to load aliases:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const aliases = await getAliases();

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Email Aliases</h1>
          <p className="text-muted-foreground">
            Manage email routing for hanniel.co
          </p>
        </div>
        <AliasTable initialAliases={aliases} />
      </main>
    </div>
  );
}
