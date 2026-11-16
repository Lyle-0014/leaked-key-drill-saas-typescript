import { InfraiClient } from "./infrai_client.ts";
import { runLeakedKeyDrill } from "./leaked_key_drill.ts";

const key = process.env.INFRAI_API_KEY;
const projectId = process.env.INFRAI_PROJECT_ID;
const suspectedKeyId = process.env.INFRAI_SUSPECTED_KEY_ID;
if (!key || !projectId || !suspectedKeyId) {
  throw new Error("Set INFRAI_API_KEY, INFRAI_PROJECT_ID, and INFRAI_SUSPECTED_KEY_ID");
}

const result = await runLeakedKeyDrill(new InfraiClient(key), {
  project_id: projectId,
  name: "leaked-key-drill-temporary",
  suspected_key_id: suspectedKeyId,
  grace_hours: 1
});
console.log(JSON.stringify(result, null, 2));
