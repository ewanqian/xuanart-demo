import crypto from "node:crypto";
import COS from "cos-nodejs-sdk-v5";
import "./load-local-env.mjs";

const secretId = process.env.TENCENTCLOUD_SECRET_ID;
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
const region = process.env.TENCENTCLOUD_REGION || "ap-guangzhou";
const commonRegions = (process.env.TENCENTCLOUD_SCAN_REGIONS || "ap-guangzhou,ap-shanghai,ap-beijing,ap-hongkong").split(",");

if (!secretId || !secretKey) {
  console.error("Missing TENCENTCLOUD_SECRET_ID or TENCENTCLOUD_SECRET_KEY.");
  process.exit(1);
}

function sha256(message, encoding = "hex") {
  return crypto.createHash("sha256").update(message).digest(encoding);
}

function hmac(key, message, encoding) {
  return crypto.createHmac("sha256", key).update(message).digest(encoding);
}

async function callTencentApi({ service, host, action, version, payload = {}, requestRegion = region }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const body = JSON.stringify(payload);
  const canonicalRequest = [
    "POST",
    "/",
    "",
    `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`,
    "content-type;host;x-tc-action",
    sha256(body),
  ].join("\n");
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    timestamp,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, service);
  const secretSigning = hmac(secretService, "tc3_request");
  const signature = hmac(secretSigning, stringToSign, "hex");
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host;x-tc-action, Signature=${signature}`;

  const response = await fetch(`https://${host}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Timestamp": String(timestamp),
      "X-TC-Region": requestRegion,
    },
    body,
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

function summarize(name, result, mapper = (x) => x) {
  const response = result.data.Response;
  if (response?.Error) {
    return { name, ok: false, error: response.Error };
  }
  return { name, ok: true, result: mapper(response) };
}

const checks = [];

checks.push(
  summarize(
    "CloudBase environments",
    await callTencentApi({
      service: "tcb",
      host: "tcb.tencentcloudapi.com",
      action: "DescribeEnvs",
      version: "2018-06-08",
      payload: {},
    }),
    (response) => (response.EnvList || []).map((env) => ({
      EnvId: env.EnvId,
      Alias: env.Alias,
      Status: env.Status,
      PackageId: env.PackageId,
      Region: env.Region,
    })),
  ),
);

const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
checks.push(await new Promise((resolve) => {
  cos.getService((error, data) => {
    if (error) {
      resolve({
        name: "COS buckets",
        ok: false,
        error: {
          Code: error.code || error.Code || "COSGetServiceError",
          Message: error.message || error.Message || String(error),
        },
      });
      return;
    }
    resolve({
      name: "COS buckets",
      ok: true,
      result: (data.Buckets || []).map((bucket) => ({
        Name: bucket.Name,
        Location: bucket.Location,
        CreationDate: bucket.CreationDate,
      })),
    });
  });
}));

const lighthouseByRegion = [];
for (const scanRegion of commonRegions) {
  lighthouseByRegion.push(summarize(
    `Lighthouse instances / ${scanRegion}`,
    await callTencentApi({
      service: "lighthouse",
      host: "lighthouse.tencentcloudapi.com",
      action: "DescribeInstances",
      version: "2020-03-24",
      payload: { Limit: 20 },
      requestRegion: scanRegion,
    }),
    (response) => ({
      TotalCount: response.TotalCount,
      Instances: (response.InstanceSet || []).map((instance) => ({
        InstanceId: instance.InstanceId,
        InstanceName: instance.InstanceName,
        Zone: instance.Zone,
        State: instance.InstanceState,
        PublicAddresses: instance.PublicAddresses,
      })),
    }),
  ));
}
checks.push(...lighthouseByRegion);

const cvmByRegion = [];
for (const scanRegion of commonRegions) {
  cvmByRegion.push(summarize(
    `CVM instances / ${scanRegion}`,
    await callTencentApi({
      service: "cvm",
      host: "cvm.tencentcloudapi.com",
      action: "DescribeInstances",
      version: "2017-03-12",
      payload: { Limit: 20 },
      requestRegion: scanRegion,
    }),
    (response) => ({
      TotalCount: response.TotalCount,
      Instances: (response.InstanceSet || []).map((instance) => ({
        InstanceId: instance.InstanceId,
        InstanceName: instance.InstanceName,
        Placement: instance.Placement,
        State: instance.InstanceState,
        PublicIpAddresses: instance.PublicIpAddresses,
      })),
    }),
  ));
}
checks.push(...cvmByRegion);

checks.push(
  summarize(
    "DNSPod domains",
    await callTencentApi({
      service: "dnspod",
      host: "dnspod.tencentcloudapi.com",
      action: "DescribeDomainList",
      version: "2021-03-23",
      payload: { Limit: 20 },
    }),
    (response) => (response.DomainList || []).map((domain) => ({
      Name: domain.Name,
      Status: domain.Status,
      Grade: domain.Grade,
    })),
  ),
);

console.log(JSON.stringify({ region, checks }, null, 2));
