# Tencent Cloud Resource Report

Date: 2026-05-19

## Result

The API key can see one DNSPod domain:

- `xuanart.com`

The same key did not find a deploy target:

- COS buckets: 0
- CloudBase environments: unavailable to this key
- Lighthouse instances: 0 in `ap-guangzhou`, `ap-shanghai`, `ap-beijing`, `ap-hongkong`
- CVM instances: 0 in `ap-guangzhou`, `ap-shanghai`, `ap-beijing`, `ap-hongkong`

## Interpretation

The account currently exposes the domain, but not the "space" needed to host this static demo. The purchased space may be in another Tencent Cloud account, attached to a different sub-user, not initialized yet, or not covered by this key's permissions.

## Recommended Path

Use COS static website hosting for this Astro demo.

1. Create or confirm one COS bucket.
2. Enable static website hosting.
3. Use `index.html` as the index document.
4. Use `404.html` as the error document.
5. Bind `xuanart.com` or `www.xuanart.com`.
6. Configure DNS CNAME.
7. Enable HTTPS.
8. Deploy with `npm run cloud:deploy:cos`.

## Local Commands

```bash
npm install
npm run build
npm run cloud:inventory
```

After a bucket exists:

```bash
export COS_BUCKET="<bucket-name-appid>"
export COS_REGION="ap-guangzhou"
npm run cloud:deploy:cos
```

## Security

The current permanent API key was shared in chat. Rotate it in Tencent Cloud CAM, then create a sub-user key limited to COS upload, DNS read, and the chosen deploy target.
