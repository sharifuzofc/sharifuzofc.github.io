# Vendor scripts (self-host for SRI)

Three.js is loaded from this folder so Subresource Integrity can be applied
without trusting a CDN at runtime.

1. Download `three.min.js` for **r128** (matches `scene3d.js`):
   https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
2. Save as `public/vendor/three.min.js`
3. Generate SRI: `openssl dgst -sha384 -binary three.min.js | openssl base64 -A`
4. Put the hash on the script tag in `index.html` (`integrity` + `crossorigin="anonymous"`).

Until the file is present, the 3D hero scene will not load.
