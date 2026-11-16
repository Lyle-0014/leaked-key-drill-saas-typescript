import assert from "node:assert/strict";
import { runLeakedKeyDrill } from "./leaked_key_drill.ts";

const calls: Array<{ method: string; path: string; body?: unknown }> = [];
const client = {
  request: async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    calls.push({ method, path, body });
    if (path === "/v1/account/keys/create") return { key: { id: "temporary-1", value: "returned-once" } } as T;
    return {} as T;
  }
} as never;

const result = await runLeakedKeyDrill(client, {
  project_id: "tenant-project",
  name: "temporary",
  suspected_key_id: "suspected-1",
  grace_hours: 1
});
assert.deepEqual(result, { reported: true, rotated: true, logSearchCompleted: true, temporaryKeyId: "temporary-1" });
assert.deepEqual(calls.map((call) => `${call.method} ${call.path}`), [
  "POST /v1/account/keys/suspected_compromise/suspected-1",
  "POST /v1/account/keys/create",
  "POST /v1/account/keys/rotate/temporary-1",
  "GET /v1/account/keys/list",
  "GET /v1/logs/search"
]);
assert.deepEqual(calls[0].body, { confirmed_leak: true, auto_rotate: false });
assert.deepEqual(calls[2].body, { grace_hours: 1, idempotency_key: "rotate-temporary-1" });
console.log("leaked-key drill decision: report, rotate, and inspect logs");
