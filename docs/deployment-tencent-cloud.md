# Tencent Cloud Deployment Notes

## Current MVP Recommendation

Use COS static website hosting first if the partner can create or confirm a bucket. The site is a static Astro build and does not need a Node server.

CloudBase Hosting is also suitable, but the API check for the provided key returned `user not exist`, so this account/key currently does not expose a usable CloudBase environment.

```bash
npm install
npm run build
npm run cloud:inventory
```

## Current Resource Check

Last checked: 2026-05-19.

- DNSPod: `xuanart.com` exists and is enabled.
- COS buckets: none visible to this key.
- CloudBase environments: not available to this key.
- Lighthouse instances: none found in Guangzhou, Shanghai, Beijing, or Hong Kong.
- CVM instances: none found in Guangzhou, Shanghai, Beijing, or Hong Kong.

Conclusion: the account currently has a domain, but no visible hosting target. The purchased "space" may be in another account, not yet initialized as a bucket/environment, or not accessible to this API key.

## COS Static Hosting Route

Use COS static hosting plus a custom domain when the existing Tencent Cloud account can create or identify a usable bucket.

1. Create or identify a COS bucket, for example `xuanart-site-<appid>`.
2. Region: choose `ap-guangzhou` or the region already purchased.
3. Upload the contents of `dist/`.
4. Enable static website hosting.
5. Set index document to `index.html`.
6. Set error document to `404.html`.
7. Bind `xuanart.com` or `www.xuanart.com` as a custom origin/static website domain.
8. Configure DNS CNAME to the COS static website endpoint or CDN endpoint.
9. Enable HTTPS certificate for the custom domain.
10. Keep HTML cache short and hashed assets long-lived.

Tencent Cloud notes: COS static website hosting serves static HTML/client-side assets only; for buckets created after 2024-01-01, use a custom domain rather than relying on the default COS website domain.

## Tencent Cloud Console Check

When login is available, check:

- CloudBase environments
- COS buckets and storage packages
- CDN domains
- DNSPod domains
- SSL certificates
- Lighthouse instances

Do not buy anything until the partner confirms the chosen deployment route.

## Secure Local Automation

The repo includes scripts that read Tencent Cloud credentials from environment variables or from `.env.local`. Do not commit keys.

Local one-time setup:

```bash
cp .env.example .env.local
chmod 600 .env.local
```

Then fill `.env.local` locally.

```bash
export TENCENTCLOUD_SECRET_ID="..."
export TENCENTCLOUD_SECRET_KEY="..."
export TENCENTCLOUD_REGION="ap-guangzhou"
export PUBLIC_SITE_URL="https://xuanart.com"

npm run build
npm run cloud:inventory
```

Deploy to an existing CloudBase environment:

```bash
export TCB_ENV_ID="<env-id>"
npm run cloud:deploy:cloudbase
```

Deploy to an existing COS bucket:

```bash
export COS_BUCKET="<bucket-name-appid>"
export COS_REGION="ap-guangzhou"
npm run build
npm run cloud:deploy:cos
```

## CloudBase Route

Use this only after the Tencent Cloud console shows a CloudBase environment.

```bash
export TENCENTCLOUD_SECRET_ID="..."
export TENCENTCLOUD_SECRET_KEY="..."
export TCB_ENV_ID="<env-id>"
npm run build
npm run cloud:deploy:cloudbase
```

After using exposed permanent keys, rotate them in CAM and create a limited-permission sub-user for future deployments.

## Official References

- Tencent Cloud COS static website hosting: https://cloud.tencent.com/document/product/436/14984
- Tencent Cloud international COS static website note: https://intl.cloud.tencent.com/document/product/436/30958
- CloudBase CLI hosting deploy: https://cloud.tencent.com/document/product/876/41539
- Tencent Cloud API key management/security: https://intl.cloud.tencent.com/pt/document/product/598/34228
