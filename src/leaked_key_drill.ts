import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

const drillInput = z.object({
  project_id: z.string().min(1),
  name: z.string().min(1),
  suspected_key_id: z.string().min(1),
  grace_hours: z.number().int().min(0).max(72)
});

export type DrillInput = z.infer<typeof drillInput>;
export type DrillResult = { reported: boolean; rotated: boolean; logSearchCompleted: boolean; temporaryKeyId?: string };

export async function runLeakedKeyDrill(client: InfraiClient, raw: DrillInput): Promise<DrillResult> {
  // The report uses account.keys.suspected_compromise before the temporary rotation.
  const input = drillInput.parse(raw);
  await client.request("POST", `/v1/account/keys/suspected_compromise/${input.suspected_key_id}`, {
    confirmed_leak: true,
    auto_rotate: false
  });
  const created = await client.request<{ key?: { id?: string; value?: string } }>("POST", "/v1/account/keys/create", {
    project_id: input.project_id,
    name: input.name,
    scopes: [],
    idempotency_key: `leaked-key-drill-${input.project_id}`
  });
  const temporaryKeyId = created.key?.id;
  if (!temporaryKeyId) throw new Error("Temporary key response did not include an id");
  await client.request("POST", `/v1/account/keys/rotate/${temporaryKeyId}`, {
    grace_hours: input.grace_hours,
    idempotency_key: `rotate-${temporaryKeyId}`
  });
  await client.request("GET", "/v1/account/keys/list");
  await client.request("GET", "/v1/logs/search");
  return { reported: true, rotated: true, logSearchCompleted: true, temporaryKeyId };
}
