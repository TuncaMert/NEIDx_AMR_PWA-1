# Netlify deployment and offline use

## Deploy

The repository includes `netlify.toml` with build command `npm run build` and publish directory `build`. The build runs `scripts/build-service-worker.cjs` after React compilation. Do not bypass this step by running only `react-scripts build`.

For manual Netlify deployment, run `npm run build` and upload the contents of `build`. The separately supplied Netlify deploy ZIP contains these built files; extract it and upload the folder containing `index.html` and `service-worker.js`.

`public/_headers` prevents stale HTTP caching of the worker. `public/_redirects` supplies the single-page application fallback. Both are copied into the build output.

## First online visit

Open the HTTPS site and keep it open until **Ready for offline use** appears. Approximately 27 MB of app files and model weights must finish downloading. Seeing the interface or loaded models alone does not establish offline readiness.

Disconnect the device, reload the same URL in the same browser profile, and test an uploaded image or camera capture. Reconnect if offline setup failed. Camera permission is still required. Offline support is not enabled by the development server (`npm start`).

## Updates and storage

The worker cache version is derived from build contents. A new version downloads completely before installation succeeds. Existing tabs keep their current worker; close all app tabs/windows and reopen once the update message appears. This avoids switching versions during a prediction.

Browser storage eviction, clearing site data, private browsing or insufficient space can remove or prevent offline files. Revisit online and wait for readiness again. The site cannot work offline on a device that has never completed the initial download.

If model weights are changed in a future release, update the IndexedDB model cache keys in `src/inference/models.js` as well, or explicitly reload the bundled models. Changing the service worker alone does not invalidate the separate TensorFlow.js model cache.

## Checks

After building, run:

```sh
node scripts/test-offline.cjs
```

This checks the generated worker against real build assets with network requests disabled after installation, including both models and all seven weight shards. It also checks that failed downloads do not replace the previous cached release. It is a simulated worker test; confirm offline operation on the actual browser/device before distributing it as a tested deployment.
