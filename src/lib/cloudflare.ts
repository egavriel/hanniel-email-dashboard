import Cloudflare from "cloudflare";

let client: Cloudflare | null = null;

export function getCFClient(): Cloudflare {
  if (!client) {
    client = new Cloudflare({
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    });
  }
  return client;
}

export const ZONE_ID = () => process.env.CLOUDFLARE_ZONE_ID!;
export const ACCOUNT_ID = () => process.env.CLOUDFLARE_ACCOUNT_ID!;
export const DESTINATION_EMAIL = () => process.env.DESTINATION_EMAIL!;
export const DOMAIN = "hanniel.co";
