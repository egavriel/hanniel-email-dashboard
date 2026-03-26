import { Nav } from "@/components/nav";
import { AliasForm } from "@/components/alias-form";

export default function NewAliasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Alias</h1>
          <p className="text-muted-foreground">
            Add a new email routing rule for hanniel.co
          </p>
        </div>
        <AliasForm />
      </main>
    </div>
  );
}
