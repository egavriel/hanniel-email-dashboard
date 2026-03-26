"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";

export function AliasForm() {
  const [alias, setAlias] = useState("");
  const [service, setService] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: alias.toLowerCase().trim(),
          service: service || undefined,
          category: category || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create alias");
      }

      toast.success(`${alias}@hanniel.co created`);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create alias");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="alias">Email Alias</Label>
        <div className="flex items-center gap-2">
          <Input
            id="alias"
            placeholder="instagram"
            value={alias}
            onChange={(e) => setAlias(e.target.value.toLowerCase())}
            pattern="^[a-z0-9][a-z0-9._-]*$"
            required
            autoFocus
          />
          <span className="text-muted-foreground whitespace-nowrap">@hanniel.co</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Service / Platform</Label>
        <Input
          id="service"
          placeholder="Instagram, Twitter, Shopee..."
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Optional notes about this alias..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading || !alias}>
        {loading ? "Creating..." : "Create Alias"}
      </Button>
    </form>
  );
}
