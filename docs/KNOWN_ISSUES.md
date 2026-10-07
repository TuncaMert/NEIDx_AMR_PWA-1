# Troubleshooting and limitations

## Camera or model loading

Use localhost or HTTPS and allow camera access. If a camera is unavailable, select a local image. If model loading fails, check the connection and retry. The model reload button refreshes both bundled models. Browser caching is optional.

Use a fresh browser profile if an older installation left cached models or a service worker. Offline mode requires a completed production download. Wait for Ready for offline use; see [Offline deployment](OFFLINE.md).

## Detection fails

Try a clearer image with the assay away from the edges. Camera crops that extend outside the image are rejected. Upload and camera processing preserve the original, different intermediate sizes; see [Processing details](REPRODUCIBILITY.md).

## Port already in use

After building, use an alternate production port on macOS or Linux:

```sh
PORT=5179 npm run start-prod
```

In Windows PowerShell:

```powershell
$env:PORT="5179"
npm run start-prod
```

Open [localhost:5179](http://localhost:5179).

## Dependencies and testing scope

The inherited dependencies have not been upgraded. An installation reported 122 vulnerability findings; the detailed audit and remediation remain outstanding. Funding notices are informational. Build success does not establish dependency security.

Real-image predictions and the complete browser camera/upload workflow remain unverified. Automated offline-worker checks pass, but real-device offline behavior still needs confirmation. Example data and expected outputs are not included. See [Validation](VALIDATION.md).

Legacy metadata endpoints, hosting configuration and icon references are not part of the validated inference workflow.
