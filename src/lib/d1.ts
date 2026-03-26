import type { AliasMetadata } from "./types";

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
};

type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
};

export async function getDB(): Promise<D1Database> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext();
  return (env as Record<string, unknown>).DB as D1Database;
}

export async function getAllMetadata(): Promise<AliasMetadata[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM alias_metadata ORDER BY created_at DESC")
    .all<AliasMetadata>();
  return result.results;
}

export async function getMetadataByRuleId(
  cfRuleId: string
): Promise<AliasMetadata | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM alias_metadata WHERE cf_rule_id = ?")
    .bind(cfRuleId)
    .first<AliasMetadata>();
}

export async function upsertMetadata(
  cfRuleId: string,
  alias: string,
  service: string | null,
  category: string | null,
  notes: string | null
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `INSERT INTO alias_metadata (cf_rule_id, alias, service, category, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(cf_rule_id) DO UPDATE SET
         service = excluded.service,
         category = excluded.category,
         notes = excluded.notes,
         updated_at = datetime('now')`
    )
    .bind(cfRuleId, alias, service, category, notes)
    .run();
}

export async function deleteMetadata(cfRuleId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM alias_metadata WHERE cf_rule_id = ?")
    .bind(cfRuleId)
    .run();
}
