export interface AliasRecord {
  cfRuleId: string;
  alias: string;
  fullAddress: string;
  destination: string;
  enabled: boolean;
  priority: number;
  service: string | null;
  category: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tracked: boolean;
}

export interface AliasMetadata {
  cf_rule_id: string;
  alias: string;
  service: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAliasInput {
  alias: string;
  service?: string;
  category?: string;
  notes?: string;
}

export interface UpdateAliasInput {
  service?: string;
  category?: string;
  notes?: string;
  enabled?: boolean;
}

export const CATEGORIES = [
  "social",
  "shopping",
  "finance",
  "newsletters",
  "gaming",
  "work",
  "personal",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];
