"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AliasRecord } from "@/lib/types";
import { toast } from "sonner";

function generateFilterXml(aliases: AliasRecord[]): string {
  const entries = aliases
    .map((alias) => {
      const label = alias.service || alias.alias;
      const addr = alias.fullAddress
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const safeLabel = label
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      return `  <entry>
    <category term="filter"/>
    <title>Filter for ${addr}</title>
    <apps:property name="hasTheWord" value="deliveredto:${addr}"/>
    <apps:property name="label" value="${safeLabel}"/>
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

export default function GmailFiltersPage() {
  const [aliases, setAliases] = useState<AliasRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aliases")
      .then((res) => res.json())
      .then((data) => setAliases(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load aliases"))
      .finally(() => setLoading(false));
  }, []);

  const xml = generateFilterXml(aliases);

  function downloadXml() {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hanniel-gmail-filters.xml";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Filter XML downloaded");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gmail Filter Generator</h1>
          <p className="text-muted-foreground">
            Generate importable Gmail filters that auto-label emails by alias
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading aliases...</p>
        ) : aliases.length === 0 ? (
          <p className="text-muted-foreground">
            No aliases found. Create some aliases first.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {aliases.length} alias{aliases.length !== 1 ? "es" : ""} found.
              Each alias gets a Gmail filter that auto-applies a label matching
              the service name.
            </p>

            <div className="flex gap-2">
              <Button onClick={downloadXml}>Download Filter XML</Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">How to import:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the XML file above</li>
                <li>Go to Gmail Settings &rarr; Filters and Blocked Addresses</li>
                <li>Scroll down and click &quot;Import filters&quot;</li>
                <li>Choose the downloaded XML file</li>
                <li>Select &quot;Apply new filters to existing email&quot; if desired</li>
                <li>Click &quot;Create filters&quot;</li>
              </ol>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <Textarea
                value={xml}
                readOnly
                rows={16}
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
