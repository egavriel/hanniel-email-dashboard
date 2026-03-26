import type { AliasRecord } from "./types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateGmailFilterXml(aliases: AliasRecord[]): string {
  const entries = aliases
    .map((alias) => {
      const label = alias.service || alias.alias;
      return `  <entry>
    <category term="filter"/>
    <title>Filter for ${escapeXml(alias.fullAddress)}</title>
    <apps:property name="hasTheWord" value="deliveredto:${escapeXml(alias.fullAddress)}"/>
    <apps:property name="label" value="${escapeXml(label)}"/>
    <apps:property name="shouldNeverSpam" value="true"/>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:apps="http://schemas.google.com/apps/2006">
  <title>Email Filters for hanniel.co aliases</title>
${entries}
</feed>`;
}
