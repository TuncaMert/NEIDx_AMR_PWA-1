# Validation

Recorded environment: macOS, Node.js 22.4.1, npm 10.8.1 and Python 3.12.4. This is the reviewer preparation environment, not a record of the original study environment.

| Check | Recorded result |
| --- | --- |
| Locked dependency installation with `npm ci --ignore-scripts --no-audit --no-fund` and temporary cache/timeout options | Passed; dependency lifecycle scripts disabled |
| `CI=true npm run build` | Passed, including subsequent camera-tab and preview-layout edits |
| `npm run lint` | Passed, including subsequent interface edits |
| `CI=true npm test -- --watchAll=false --runInBand` | 3 suites, 9 tests passed; rerun after the offline update |
| `node scripts/smoke_models.cjs` | Both models loaded and produced finite outputs on CPU |
| Production server on port 5179 | Served application HTML |
| `node scripts/test-offline.cjs` | Passed offline navigation and exact JS/CSS/model bytes, readiness reporting, failed-install cleanup and preservation of the prior release in a simulated worker environment |
| `python3 scripts/verify_package.py` | Package checksums, dependency declarations and model shard sizes passed |

The synthetic classifier input/output shapes were `[1,224,224,3]` and `[1,2]`; detector shapes were `[1,640,640,3]` and `[1,5,8400]`.

Regression tests cover model loading, failure cleanup, detector decoding, no-detection handling, crop geometry, classifier normalization and label ordering. The application test mocks the classification screen.

## Limits

These checks do not establish accuracy or equivalence to the manuscript's results. No example images or verified expected outputs are included. End-to-end browser camera/upload tests, real-image inference, browser caching and GPU parity remain unverified. Browser inspection could not be completed.

Dependencies were not upgraded. Reported vulnerability findings have not been resolved; the attempted detailed audit failed to reach the registry. Offline behavior was tested with the generated production worker and real build files using a simulated Cache API and disconnected network. A real browser/device offline test and live Netlify deployment verification remain outstanding.
