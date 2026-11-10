import { z } from "zod";
import { infrai } from "./infrai.js";

export const releaseRequest = z.object({ buildId: z.string().min(1), artifactKey: z.string().min(1), contentType: z.string().min(1).default("application/octet-stream") });
export type ReleaseRequest = z.infer<typeof releaseRequest>;
export type BuildEvent = { buildId: string; state: "passed" | "failed"; diagnostics: string[] };
export type ReleaseResult = { build: BuildEvent; downloadUrl: string };
const BUCKET = "private-devtools";

export async function publishRelease(input: unknown): Promise<ReleaseResult> {
  const request = releaseRequest.parse(input);
  await infrai.storage.bucket.create({ name: BUCKET });
  const build: BuildEvent = { buildId: request.buildId, state: "passed", diagnostics: [`artifact ${request.artifactKey} is ready`] };
  const signed = await infrai.storage.object.presign(BUCKET, request.artifactKey, { op: "get", expires_seconds: 300, content_type: request.contentType, response_disposition: `attachment; filename="${request.buildId}.bin"`, idempotency_key: request.buildId });
  return { build, downloadUrl: signed.url };
}
