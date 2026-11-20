# Deploy the ZERO STUDIO image Worker from Android

This guide deploys only the isolated inference Worker. It does not deploy the ZERO STUDIO app or merge PR #6.

## Before starting
- Use a Cloudflare account that remains on the Workers Free plan.
- Do not add a payment method, upgrade to Workers Paid, purchase AI Gateway credits, or accept a paid trial.
- If Cloudflare requires a card or paid upgrade to continue, stop. Do not bypass that requirement.
- The Worker uses only the Cloudflare Workers AI binding and the fixed FLUX.1 Schnell model. It has no provider fallback.
- Never paste a secret into GitHub, this chat, source files, build variables, or a public issue.

## Connect GitHub to Cloudflare Workers Builds
From the Cloudflare dashboard in the Android browser:
1. Open Workers & Pages and choose Create application.
2. Choose the GitHub repository integration and authorize the Cloudflare GitHub App only if you are comfortable granting the requested repository access.
3. Select repository laracheinarave4675-max/zero-studio.
4. Select branch feat/hybrid-human-art-pipeline. This is an isolated Worker project; do not select or alter the app's production deployment.
5. Set Root directory to cloudflare-worker.
6. Leave Build command empty.
7. Set Deploy command to npx wrangler deploy.
8. The Worker name must be exactly zero-studio-image-worker (matching wrangler.toml).
9. Review settings and create the Worker using Workers Free only.

Official guide: https://developers.cloudflare.com/workers/ci-cd/builds/

## Add runtime configuration
In the new Worker dashboard, open Settings > Variables and Secrets:
- Add STUDIO_ORIGIN as a plain text variable. It must be the exact origin of the deployed ZERO STUDIO web app, e.g. https://your-app.example, with no path or trailing slash. Do not guess this value; copy the actual app origin.
- Add STUDIO_ACCESS_TOKEN as a Secret, not a plain variable. Generate a unique random value of at least 32 characters. Keep it private and do not send it in chat or commit it.
- Confirm the AI binding exists. It is declared in wrangler.toml and binds Cloudflare Workers AI.

Official secrets guide: https://developers.cloudflare.com/workers/configuration/secrets/

## Smoke test
Open the Worker URL in a browser:

    https://<worker-name>.<your-subdomain>.workers.dev/health

A successful response should contain ok: true and the fixed provider/model identifiers. The health endpoint does not generate an image or reveal secrets.

The image endpoint is POST /v1/images, requires the bearer secret, and accepts JSON:

    { "prompt": "A cinematic hand-painted anime forest house at golden hour", "steps": 4 }

Do not expose the bearer token in a URL. Do not test image generation until the exact app origin and secret are configured and the user deliberately authorizes the first request.

## Safety behavior
- Requests are rejected unless the exact configured app origin matches.
- Every image request requires the bearer secret.
- Prompt length is limited to 2,048 characters; request body to 8 KiB.
- The Worker fixes the model to FLUX.1 Schnell and caps steps at 4.
- No alternate provider, paid fallback, credit purchase, or automatic upgrade exists in the code.
- Provider quota/rate-limit errors become HTTP 429 free_quota_exhausted; keep the job and retry after reset.
- Provider details are not returned in error messages.
- This Worker does not promise unlimited or 24-images-per-second inference.

## Current deployment state
The Worker source, Wrangler configuration, automated tests, and this guide are committed to the development branch. No Cloudflare account has been connected, no Worker has been deployed, no secrets have been entered, and no image inference request has been made.