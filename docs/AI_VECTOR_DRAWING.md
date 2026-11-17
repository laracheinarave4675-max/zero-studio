# ZERO STUDIO — AI Vector Drawing Adapter

## What it does

The optional drawing assistant sends a text-only drawing description to Google's Gemini Developer API and asks for a JSON list of editable SVG path operations. It does **not** call an image or video generation model and does not upload artwork or reference images. The response is validated by the local drawing engine, previewed as a temporary SVG layer, and added to the project only after the user explicitly approves it.

## Provider and cost

- Model: `gemini-3.5-flash-lite`.
- Endpoint: `generateContent` with `responseMimeType: application/json`.
- The model is listed with a free tier in Google's pricing page; access and quotas can change. Free-tier requests may be used by Google to improve products. Do not send confidential or sensitive prompts.
- Mauritania appears in Google's currently published supported-regions list, but account age verification, API-key eligibility, and network/IP checks still apply.
- ZERO STUDIO does not enable billing or create a paid plan; the user must monitor their Google account and quotas.

References:
- [Gemini API generateContent REST reference](https://ai.google.dev/api/generate-content)
- [Gemini API pricing and free-tier data use](https://ai.google.dev/gemini-api/docs/pricing)
- [Available regions](https://ai.google.dev/gemini-api/docs/available-regions)

## Key handling and approval

- The API key is entered into a password field and sent in the `x-goog-api-key` request header.
- The key is not written to localStorage, project files, exported ZIPs, or repository source.
- The key remains only in the page field for the current open session; reload the page to clear it.
- The prompt is sent to Google. Keep private information out of it.
- Generated paths are checked by the local path validator. The proposal is not committed until the user presses **Approve**.
- Provider output is untrusted input. Validation limits path characters, coordinate magnitude, colors, and widths. This is not a full SVG path parser; inspect the preview before approval.

## Current limits

This is a first text-to-vector integration, not a trained anime artist. Model output may be crude, incomplete, or inconsistent. It has not yet been tested with a real API key or on the user's Android browser. It does not create in-betweens, maintain a character model sheet, or achieve the 24-unique-drawings-per-second target.
