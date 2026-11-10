import assert from "node:assert/strict";
import { releaseRequest } from "./release.js";

const parsed = releaseRequest.parse({ buildId: "build-42", artifactKey: "cli/linux-x64" });
assert.equal(parsed.contentType, "application/octet-stream");
assert.throws(() => releaseRequest.parse({ buildId: "", artifactKey: "x" }));
console.log("release request validation: passed");
