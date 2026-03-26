"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AliasRecord } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { toast } from "sonner";

interface AliasTableProps {
  initialAliases: AliasRecord[];
}

export function AliasTable({ initialAliases }: AliasTableProps) {
  const [aliases, setAliases] = useState<AliasRecord[]>(initialAliases);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = aliases.filter((a) => {
    const matchesSearch =
      !search ||
      a.alias.includes(search.toLowerCase()) ||
      a.service?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function toggleAlias(alias: AliasRecord) {
    const newEnabled = !alias.enabled;
    setAliases((prev) =>
      prev.map((a) =>
        a.cfRuleId === alias.cfRuleId ? { ...a, enabled: newEnabled } : a
      )
    );

    try {
      const res = await fetch(`/api/aliases/${alias.cfRuleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${alias.alias} ${newEnabled ? "enabled" : "disabled"}`);
    } catch {
      setAliases((prev) =>
        prev.map((a) =>
          a.cfRuleId === alias.cfRuleId ? { ...a, enabled: !newEnabled } : a
        )
      );
      toast.error("Failed to update alias");
    }
  }

  async function deleteAlias(alias: AliasRecord) {
    if (!confirm(`Delete ${alias.fullAddress}?`)) return;

    try {
      const res = await fetch(`/api/aliases/${alias.cfRuleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setAliases((prev) => prev.filter((a) => a.cfRuleId !== alias.cfRuleId));
      toast.success(`${alias.alias} deleted`);
    } catch {
      toast.error("Failed to delete alias");
    }
  }

  const activeCount = aliases.filter((a) => a.enabled).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Aliases</p>
          <p className="text-2xl font-bold">{aliases.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Disabled</p>
          <p className="text-2xl font-bold">{aliases.length - activeCount}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search aliases or services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {aliases.length === 0
                    ? "No aliases yet. Create your first alias!"
                    : "No aliases match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((alias) => (
                <TableRow key={alias.cfRuleId}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{alias.fullAddress}</span>
                      {!alias.tracked && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          untracked
                        </Badge>
                      )}
                    </div>
                    {alias.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alias.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{alias.service || "-"}</TableCell>
                  <TableCell>
                    {alias.category ? (
                      <Badge variant="secondary">{alias.category}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alias.destination}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={alias.enabled}
                      onCheckedChange={() => toggleAlias(alias)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAlias(alias)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
