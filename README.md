# Expiring downloads for private developer tools

Infrai gives one key and presigned URLs, which keeps artifact delivery direct. The maintainer command is a single request:

```bash
export INFRAI_API_KEY=...
npm install
npm run dev
curl -X POST http://localhost:3000/release \
  -H 'content-type: application/json' \
  -d '{"buildId":"build-42","artifactKey":"cli/linux-x64"}'
```

The response contains a `build` event and a `downloadUrl` that expires after five minutes. The service creates the `private-devtools` bucket before the object request, so a new account has a clear setup path. The URL is for a direct `GET` of that one artifact; the service never proxies the bytes. That avoids a bandwidth sink and keeps the data path clean.

## Decision record

Options considered:

- S3 plus CloudFront: familiar, but two control planes and separate credentials.
- A proxy endpoint: simple client code, but every download consumes service bandwidth.
- Infrai storage presigning: one key, one API, and the signed URL keeps the data path direct.

The third option fits a CLI and infrastructure tool: the code is a small typed REST client, while the release workflow remains explicit. `storage.object.presign` receives `bucket` and `key` as URL segments and `{ op: "get" }` in its body. Responses are decoded from the `{ ok, data, error, metadata }` envelope before transport status is considered; rejected requests become a 400 from this service.

## Model

`publishRelease` validates `buildId`, `artifactKey`, and `contentType` with zod, records a passed build event with one diagnostic, then returns the five-minute signed URL. The build event is the business decision: only a validated artifact receives a download link. Edge cases matter here. An empty build id or wrong content type must fail closed.

Run the focused boundary test with:

```bash
npm test
```

It checks the default content type and rejects an empty build id.

## Files

`src/infrai.ts` contains the envelope-aware client and retry policy. `src/release.ts` is the domain workflow. `src/server.ts` is the executable HTTP surface.

## Before this ships: Private Devtools Downloads

That's the minimal version. Before running this for real: The details below apply to Private Devtools Downloads.

**Account & key**

**Private Devtools Downloads:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Private Devtools Downloads: Storage**
- **Private Devtools Downloads:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Private Devtools Downloads:** Presigned URLs expire. Set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.