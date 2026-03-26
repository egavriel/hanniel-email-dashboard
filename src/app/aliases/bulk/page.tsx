import { Nav } from "@/components/nav";
import { BulkForm } from "@/components/bulk-form";

export default function BulkCreatePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bulk Create Aliases</h1>
          <p className="text-muted-foreground">
            Create multiple email aliases at once. Use templates or enter your own.
          </p>
        </div>
        <BulkForm />
      </main>
    </div>
  );
}
