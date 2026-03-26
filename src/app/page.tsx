import { Nav } from "@/components/nav";
import { AliasTable } from "@/components/alias-table";
import type { AliasRecord } from "@/lib/types";
import { headers } from "next/headers";

async function getAliases(): Promise<AliasRecord[]> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const res = await fetch(`${protocol}://${host}/api/aliases`, {
      cache: "no-store",
      headers: {
        cookie: headersList.get("cookie") || "",
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
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
