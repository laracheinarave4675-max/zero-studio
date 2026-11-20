# FLUX.2 widescreen preview

This branch adds an opt-in FLUX.2 Klein 4B path for image generation.

- FLUX.1 Schnell remains the selected default and continues using the existing image request shape.
- FLUX.2 Klein 4B sends explicit model dimensions through Workers AI multipart input.
- The 16:9 preset is 1280 × 720; the square preset is 1024 × 1024.
- The preview Worker is isolated as `zero-studio-flux2-preview` and uses a separate KV gallery namespace.
- Vercel preview environment variables route this branch to that Worker only.
- No production Worker, production environment variable, or open pull request is changed by the preview setup.

The Workers AI integration follows Cloudflare's FLUX.2 Klein 4B Workers AI multipart example and its 256–1920 width/height limits. The model has a fixed four-step process. Free quota exhaustion is surfaced as an error; this branch does not try another model or provider.
