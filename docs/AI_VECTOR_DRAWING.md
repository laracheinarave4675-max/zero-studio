# ZERO STUDIO — AI Vector Drawing Adapter

## What it does

The earlier vector artist sends a text-only scene description to Google's Gemini Developer API and asks for structured JSON scene paths. The newer semantic 3D artist sends a text-only scene description and asks for a compact 3D blueprint, then locally constructs and projects the geometry to SVG. The environment-art prompt now explicitly directs cinematic 2.5D depth: camera/horizon/vanishing points, five depth zones, atmospheric perspective, consistent sun direction, cast/contact shadows, ambient occlusion, reflections, material-specific surface treatment, roof/window construction, irregular foliage, and selective rather than heavy outlines. The older single-layer vector proposal function remains available for compatibility. It does **not** call an image or video generation model and does not upload artwork or reference images. Every layer name and every path is validated locally. The complete multi-layer scene is previewed on the canvas and added as separate editable project layers only after the user explicitly approves it.

## Semantic 3D environment artist (new experimental pipeline)

The new environment pipeline separates art direction from geometry production:

1. Gemini returns a compact semantic 3D scene blueprint: perspective camera, building dimensions, facade/window/door/sign placement, roof material, trees, utility poles, vehicle, palette, and sun direction.
2. `app/mesh-scene-renderer.mjs` builds actual 3D mesh faces for the architecture, roof, windows, trees, road, poles, and vehicle.
3. A local perspective camera projects the geometry into SVG paths. A directional-light calculation assigns a distinct shaded color to each face. The result is saved as editable paths in five semantic layers and can be opened as a normal ZERO project.

The current still-scene renderer allows up to 2,800 vector paths. The successful Gemini 3.5 Flash Lite trial returned a five-layer editable scene with 632 paths. The three-dimensional geometry and perspective are real; the final deliverable remains SVG vector artwork, not a raster image.

**Important limits:** this is an early stylized mesh renderer, not a professional 3D package or a painterly anime renderer. It does not yet have texture maps, physically based materials, advanced global illumination, soft shadow maps, character rigs, or detailed foliage/architecture assets. Face shading is a simple directional-light approximation. Reusable SVG gradients now add material transitions for sky, sun, plaster, wood, roof, glass, road, foliage, and shadows. The current animation production contract still caps each generated frame at 300 paths and has not yet been integrated with this 2,800-path still-scene renderer. Therefore this milestone proves that ZERO can generate a true 3D geometric environment and export it as SVG; it does not yet prove reference-quality art or 24 unique high-detail 3D drawings per second.

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

This is still a prompt-directed text-to-vector integration, not a trained anime painter or a true 3D renderer. The revised prompt is an art-direction improvement, not proof that Gemini can obey it. Model output may remain crude, incomplete, or inconsistent; the 300-path ceiling and text-only path generation limit fine painterly detail. SVG layers can simulate 2.5D depth but do not provide real 3D meshes, physically based materials, or a 3D lighting pipeline. It has not yet been tested with a real API key or on the user's Android browser. It does not yet guarantee professional anatomy, character consistency across shots, automatic continuity, or the 24-unique-drawings-per-second target. The provider response has not yet been tested with a real API key.
