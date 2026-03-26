import Cloudflare from "cloudflare";

export const DOMAIN = "hanniel.co";

async function getEnv(): Promise<Record<string, string>> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext();
  return env as Record<string, string>;
}

export async function getCFClient(): Promise<Cloudflare> {
  const env = await getEnv();
  return new Cloudflare({
    apiToken: env.CLOUDFLARE_API_TOKEN,
    fetch: globalThis.fetch.bind(globalThis),
  });
}

export async function getZoneId(): Promise<string> {
  const env = await getEnv();
  return env.CLOUDFLARE_ZONE_ID;
}

export async function getAccountId(): Promise<string> {
  const env = await getEnv();
  return env.CLOUDFLARE_ACCOUNT_ID;
}

export async function getDestinationEmail(): Promise<string> {
  const env = await getEnv();
  return env.DESTINATION_EMAIL;
}
