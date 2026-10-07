NEIDx — INSTALLATION AND USER GUIDE

Companion software for:
Hardware-Free Testing for Antimicrobial Resistance Using Artificial Intelligence
Manuscript status: Under peer review.

INSTALL AND START
1. Install Node.js and npm. Packaging checks used Node.js 22.4.1 and npm 10.8.1.
2. Extract the ZIP and open a terminal in the folder containing package.json.
3. Run: npm ci
   Internet access is required to download dependencies.
4. Run: npm start
5. Open http://localhost:3000 if the browser does not open automatically.

USE
The camera tab opens first. Click Start camera, allow camera access, position
an assay in the preview, and click Classify. Start camera is hidden when active.
Alternatively, choose Select image, select a file, wait for its preview, and
click Classify.

The photo controls collapse after a successful prediction. Results show the
detected region and Negative/Positive model scores. Click Take or select
another photo to reopen the controls. If detection fails, try a clearer image
with the assay centered away from the edges.

Camera access requires localhost or HTTPS and browser permission. Capture is
640 by 640 pixels. Stop the server with Ctrl+C in the terminal.

PRODUCTION BUILD
Run: npm run build
Then: npm run start-prod
Open http://localhost:5000.
If the port is occupied, see docs/KNOWN_ISSUES.md for alternate-port commands.

NETLIFY AND OFFLINE USE
Build command: npm run build
Publish directory: build
For manual deployment, upload the generated build folder.
Open the deployed HTTPS site while online and wait for Ready for offline use.
The first visit downloads about 27 MB. Then disconnect and reload the same
site in the same browser profile. Offline caching is not enabled by npm start.
If storage is cleared or evicted, revisit online to download the files again.
For updates, close all app tabs/windows and reopen after the update downloads.
See docs/OFFLINE.md for details.

CHECKS
Regression tests: npm test -- --watchAll=false --runInBand
Synthetic model check: node scripts/smoke_models.cjs
Optional file integrity check (Python 3): python3 scripts/verify_package.py

The model check verifies loading and execution, not prediction accuracy.
See docs/VALIDATION.md for completed checks and limitations.

SCOPE
This package includes the inference app and trained models. Training and
evaluation scripts, datasets, example images and verified expected outputs
are not included. It does not independently reproduce the manuscript's
reported performance. Displayed percentages are model scores.

CONTACT AND LICENSE
Software: Mert Tunca Doganay, mxt670@case.edu
Manuscript: Mohamed S. Draz, mxd665@case.edu
Existing license declarations: docs/LICENSING.md
Full overview and manuscript authors: README.md
