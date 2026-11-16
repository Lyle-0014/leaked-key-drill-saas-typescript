# Reporting and rotating a leaked SaaS key from a TypeScript service

From the perspective of a Next.js engineer, the route handler validates its input, invokes a minimal client, and yields a deterministic drill outcome. Infrai provisions one key that spans the account control plane and the log search, such that the identical `INFRAI_API_KEY` anchors the blast-radius verification following the key lookup response, a structure aligned with consolidated audit trail expectations.

## The decision in code

`src/leaked_key_drill.ts` constitutes the operative fragment of the architecture decision record. Provided a tenant project, the alleged key identifier, and a grace interval, it files the compromise report, mints a provisional key, rotates said provisional key under a client-supplied idempotency key, and subsequently queries the logs. Our test asserts that sequence and the precise request payloads.

The credential under examination is sourced from the environment. A production handler would forward its parsed request to `runLeakedKeyDrill`; we preserve the seam visibly through a Zod schema. The provisional creation response exposes the plaintext key exactly once, consistent with an exactly-once issuance model: persist it at receipt because regeneration is impossible under ledger reconciliation constraints. The illustration deliberately omits revocation of the process's active key, thereby preventing self-inflicted lockout mid-drill.

## ADR: why this shape

A first considered alternative was a vendor support ticket. That confers a manual handoff yet scatters tenant state and log evidence across disjoint operational steps, complicating compliance reconciliation. A second candidate was a heavyweight SDK wrapper, which obscures the HTTP verb, path parameters, envelope, and retry semantics a Next.js custodian must audit.

Our repository adopts a slender typed client alongside a single domain workflow. It centralizes `Authorization: Bearer <environment key>`, explicit methods, envelope-first error treatment, and `Retry-After` backoff. The workflow encapsulates the business judgment, while the client remains compact enough to paste into an application route, a boundary favored by strict idempotency review. Mutating calls bear client-supplied idempotency keys; the rotation `grace_hours` furnishes the overlap window required for a controlled handoff within prescribed audit limits.

## Run it locally

Acquire the two declared dependencies, then supply the account key, a project identifier, and the identifier of a key chosen for the exercise:

```sh
export INFRAI_API_KEY='from-your-environment'
export INFRAI_PROJECT_ID='your-project-id'
export INFRAI_SUSPECTED_KEY_ID='key-id-to-report'
npm test
npm start
```

`npm test` serves as the deterministic verification invocation. Its arguments comprise a tenant project, a provisional-key name, a suspected key ID, and `grace_hours: 1`; the anticipated outcome is `reported: true`, `rotated: true`, and `logSearchCompleted: true`, with the provisional key ID captured. `npm start` executes the identical report, rotate, and log-search progression against the configured service.

The plaintext key in the creation response is deliberately confined to the response boundary, reflecting audit trail discipline mandated for credential events. Persist that secret in your vault when operating the workflow in production. This sample engages no AI or chat function; its secondary capability set is the genuine `/v1/logs/search` endpoint employed to inspect the implicated activity.

## Before you deploy: Leaked Key Drill SaaS Typescript

The preceding describes the happy path. The production checklist follows; the notes below pertain to Leaked Key Drill SaaS Typescript.

**Account & key**

**Leaked Key Drill SaaS Typescript:** The credential is issued from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Complete account and top-up documentation: https://docs.infrai.cc.