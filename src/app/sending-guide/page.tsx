import { Nav } from "@/components/nav";
import { Separator } from "@/components/ui/separator";

export default function SendingGuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sending Guide</h1>
          <p className="text-muted-foreground">
            Set up sending emails from your hanniel.co aliases via Gmail
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Overview</h2>
            <p className="text-muted-foreground">
              Cloudflare Email Routing handles <strong>receiving</strong>. For{" "}
              <strong>sending</strong>, we use Brevo (free SMTP relay, 300 emails/day)
              combined with Gmail&apos;s &quot;Send mail as&quot; feature. One set of Brevo
              credentials works for all your aliases.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold">Step 1: Sign up for Brevo</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to brevo.com and create a free account</li>
              <li>Navigate to Settings &rarr; SMTP & API</li>
              <li>Click &quot;Generate a new SMTP key&quot;</li>
              <li>Save the SMTP key — you&apos;ll need it for Gmail</li>
            </ol>
            <div className="mt-3 rounded-lg border bg-muted/50 p-4 font-mono text-sm">
              <p>SMTP Server: smtp-relay.brevo.com</p>
              <p>Port: 587</p>
              <p>Username: your Brevo login email</p>
              <p>Password: your SMTP key</p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold">Step 2: Add Domain in Brevo</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Brevo Dashboard &rarr; Settings &rarr; Senders, Domains & Dedicated IPs</li>
              <li>Click &quot;Domains&quot; tab &rarr; &quot;Add a domain&quot;</li>
              <li>Enter: hanniel.co</li>
              <li>Brevo will give you DNS records to add</li>
            </ol>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold">Step 3: Add DNS Records</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Add these records in Cloudflare DNS for hanniel.co:
            </p>
            <div className="rounded-lg border bg-muted/50 p-4 font-mono text-xs space-y-3">
              <div>
                <p className="text-muted-foreground">Update existing SPF record:</p>
                <p>TXT hanniel.co</p>
                <p>&quot;v=spf1 include:_spf.mx.cloudflare.net include:sendinblue.com ~all&quot;</p>
              </div>
              <div>
                <p className="text-muted-foreground">Add DKIM record (from Brevo):</p>
                <p>TXT mail._domainkey.hanniel.co</p>
                <p>(value provided by Brevo)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Add DMARC record:</p>
                <p>TXT _dmarc.hanniel.co</p>
                <p>&quot;v=DMARC1; p=none; rua=mailto:dmarc@hanniel.co&quot;</p>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold">Step 4: Configure Gmail &quot;Send mail as&quot;</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Repeat this for each alias you want to send from:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Gmail &rarr; Settings (gear icon) &rarr; See all settings</li>
              <li>Go to &quot;Accounts and Import&quot; tab</li>
              <li>Under &quot;Send mail as&quot;, click &quot;Add another email address&quot;</li>
              <li>Enter your name and the alias (e.g., instagram@hanniel.co)</li>
              <li>Uncheck &quot;Treat as an alias&quot;</li>
              <li>
                Enter SMTP settings:
                <div className="ml-4 mt-1 rounded border bg-muted/50 p-2 font-mono text-xs">
                  <p>SMTP Server: smtp-relay.brevo.com</p>
                  <p>Port: 587</p>
                  <p>Username: (your Brevo login email)</p>
                  <p>Password: (your SMTP key)</p>
                  <p>Connection: TLS</p>
                </div>
              </li>
              <li>
                Gmail sends a verification email to the alias — Cloudflare forwards
                it to your Gmail — click the verification link
              </li>
              <li>Done! Select this identity when composing in Gmail</li>
            </ol>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold">Step 5: Verify Deliverability</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Send a test email from an alias to a different email account</li>
              <li>Check the &quot;from&quot; address shows your alias, not your Gmail</li>
              <li>
                Test deliverability at mail-tester.com — send to their test address
                and check your score
              </li>
              <li>Check SPF/DKIM/DMARC at mxtoolbox.com &rarr; Email Health</li>
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
