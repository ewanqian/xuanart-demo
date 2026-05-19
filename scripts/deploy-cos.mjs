import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import COS from "cos-nodejs-sdk-v5";
import "./load-local-env.mjs";

const secretId = process.env.TENCENTCLOUD_SECRET_ID;
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
const bucket = process.env.COS_BUCKET;
const region = process.env.COS_REGION || process.env.TENCENTCLOUD_REGION || "ap-guangzhou";

if (!secretId || !secretKey || !bucket) {
  console.error("Missing TENCENTCLOUD_SECRET_ID, TENCENTCLOUD_SECRET_KEY, or COS_BUCKET.");
  process.exit(1);
}

const root = "dist";
if (!statSync(join(root, "index.html"), { throwIfNoEntry: false })) {
  console.error("dist/index.html not found. Run npm run build first.");
  process.exit(1);
}

const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".avif")) return "image/avif";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".xml")) return "application/xml";
  if (file.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function cacheControl(file) {
  if (file.endsWith(".html")) return "no-cache";
  if (file.includes("/_astro/")) return "public, max-age=31536000, immutable";
  return "public, max-age=3600";
}

function contentDisposition(file) {
  return file.endsWith(".html") ? "inline" : undefined;
}

for (const file of walk(root)) {
  const key = relative(root, file).replaceAll("\\", "/");
  await new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Region: region,
      Key: key,
      Body: readFileSync(file),
      ContentType: contentType(file),
      CacheControl: cacheControl(key),
    };
    const disposition = contentDisposition(key);
    if (disposition) params.ContentDisposition = disposition;

    cos.putObject(
      params,
      (error) => (error ? reject(error) : resolve()),
    );
  });
  console.log(`uploaded ${key}`);
}

console.log(`Done. Check static website/domain settings for bucket ${bucket} in ${region}.`);
