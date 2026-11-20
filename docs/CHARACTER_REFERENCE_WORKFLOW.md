# Character reference workflow

This branch adds image-conditioned character iterations to the isolated FLUX.2 Klein 4B preview path.

## Why the text-only test failed

The earlier UI request sent only a prompt. The Worker therefore ran text-to-image generation without any character pixels; repeating a description could not reliably preserve a particular face, costume, or silhouette.

## Intended workflow

1. Generate or choose one strong, approved character image.
2. In the result preview, choose **Use this image as the primary character reference**, or choose **Use as a character reference** on an existing gallery card.
3. Add up to three supporting views/details from the Android device or gallery.
4. Request a specific change (for example: side view, back view, walking pose). Do not rewrite the character description; the image reference should carry visual identity.
5. Review the result before promoting it to the primary reference. Keep prior approved views as supporting references where useful.

The browser resizes each selected reference to a maximum side of 511 px and JPEG-compresses it to no more than 512 KB. The first reference is treated as the primary identity reference; additional images are presented as supporting views/details. References are stored in this browser's local storage and are sent only when the FLUX.2 Klein 4B option is selected. Choosing a reference automatically switches the model selector to FLUX.2.

## Request path

- The UI posts reference data URLs to the same-origin Vercel `/api/images` route.
- The Vercel route validates MIME types, count and byte limits, then forwards the references to the isolated Worker using the existing protected server-to-server bearer token.
- The Worker decodes the images and builds Cloudflare Workers AI multipart fields named `input_image_0` through `input_image_3`.
- The Worker accepts references only for `@cf/black-forest-labs/flux-2-klein-4b`. It rejects unsupported reference payloads and does not fall back to another model or paid service.
- Gallery images are retrieved for reference use through the same-origin `/api/gallery-image` proxy; the browser does not need cross-origin access to the Worker image bytes.

## Limits and artistic caveat

Cloudflare documents up to four multi-reference images for FLUX.2 Klein 4B, with each input image smaller than 512×512. This integration enforces up to four images and a 512 KB file-size cap; the browser resizes the image dimensions below 512 px. Reference conditioning is not a mathematical identity lock. Facial details, exact costume seams, small accessories, perspective and anatomy may still drift. A stable model sheet still requires iterative approval, careful reference selection, and potentially a separately trained character adapter/model if a truly production-grade identity lock becomes necessary. No LoRA training or identity guarantee is claimed here.

This branch is isolated from the published production Worker and is not merged or deployed to production by this change.
