"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const TEMPLATES: Record<string, string> = {
  "Social Media": `instagram,Instagram,social
twitter,Twitter/X,social
facebook,Facebook,social
tiktok,TikTok,social
linkedin,LinkedIn,social
youtube,YouTube,social
threads,Threads,social`,
  Shopping: `shopee,Shopee,shopping
tokopedia,Tokopedia,shopping
lazada,Lazada,shopping
amazon,Amazon,shopping`,
  Finance: `bank,Banking,finance
crypto,Crypto,finance
paypal,PayPal,finance`,
};

interface BulkResult {
  alias: string;
  success: boolean;
  error?: string;
}

export function BulkForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const router = useRouter();

  function applyTemplate(name: string) {
    setInput(TEMPLATES[name] || "");
    setResults(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const aliases = lines.map((line) => {
      const [alias, service, category] = line.split(",").map((s) => s.trim());
      return { alias: alias.toLowerCase(), service, category };
    });

    try {
      const res = await fetch("/api/aliases/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliases }),
      });

      const data = await res.json();
      setResults(data.results || []);

      if (data.success === data.total) {
        toast.success(`All ${data.total} aliases created`);
      } else {
        toast.warning(`${data.success}/${data.total} aliases created`);
      }
    } catch {
      toast.error("Bulk create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Label className="mb-2 block">Quick Templates</Label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(TEMPLATES).map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bulk">
            Aliases (one per line: alias,service,category)
          </Label>
          <Textarea
            id="bulk"
            placeholder={`instagram,Instagram,social\ntwitter,Twitter/X,social`}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResults(null);
            }}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <Button type="submit" disabled={loading || !input.trim()}>
          {loading
            ? "Creating..."
            : `Create ${input.split("\n").filter((l) => l.trim()).length} Aliases`}
        </Button>
      </form>

      {results && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-medium">Results</h3>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={r.success ? "text-green-600" : "text-destructive"}>
                {r.success ? "OK" : "FAIL"}
              </span>
              <span className="font-mono">{r.alias}@hanniel.co</span>
              {r.error && (
                <span className="text-muted-foreground">— {r.error}</span>
              )}
            </div>
          ))}
          {results.every((r) => r.success) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              View Dashboard
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
