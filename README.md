# NEIDx manuscript companion code

NEIDx is a React browser application for detecting an assay area in an image and classifying it as Negative or Positive using two bundled TensorFlow.js models. This package contains the supplied application source and exported model weights. It is a submission draft, pending author confirmation of manuscript metadata, licensing, and reproducibility.

## Scope

Included: browser inference application, local Express server, trained classification and assay detection models, dependency lockfiles, and integrity checks.

Not included: training scripts, training or evaluation datasets, dataset splits, model selection procedures, performance evaluation scripts, manuscript figure generation, or example inputs with expected outputs. This package alone does not reproduce the manuscript's quantitative results.

## Access the App
NEIDx is available at neidx.netlify.app.

## Setup

Install Node.js and npm. The original development versions were not recorded. Packaging checks used Node.js 22.4.1, npm 10.8.1, and Python 3.12.4; this environment passed the checks in `docs/VALIDATION.md`, but it does not establish the original study environment. Python 3 is only needed for the optional integrity check.

From this directory:

```sh
npm ci
npm start
```

The development interface normally opens at `http://localhost:3000`. Dependency download requires internet access. Use npm and `package-lock.json` for this snapshot; `yarn.lock` is retained as historical source material, not an alternative validated dependency resolution.

To run the supplied production server:

```sh
npm run build
npm run start-prod
```

Open `http://localhost:5000`. The original server uses `PORT` when provided. The bundled `manifest.yml` is an inherited deployment example, not a journal submission or validated hosting configuration.

The locked dependencies were installed with lifecycle scripts disabled; production compilation, lint, nine automated tests and synthetic execution of both bundled models passed. Full browser inference and camera operation remain unverified. See [Validation](docs/VALIDATION.md) for exact commands and limitations. Read [Known issues](docs/KNOWN_ISSUES.md) and [Refactor notes](docs/REFACTOR_NOTES.md) before interpreting results.

## Use

The camera tab opens first. Click Start camera, grant camera permission, and click Classify. Alternatively, choose Select image, select a file and wait for its preview to load, then click Classify. The upload crop box is reset before detection as in the original implementation. Camera use requires a browser that permits it on localhost or a secure origin. The displayed values are model output scores, not established clinical accuracy estimates. No example image or expected result was supplied for independent verification.

## Files

| Location | Contents |
| --- | --- |
| `src/pages/Classify.js` | User interface, camera and image selection |
| `src/inference/` | Model loading, detection, cropping and classification |
| `src/model/classes.js` | Output mapping: 0 Negative, 1 Positive |
| `src/model/labels.json` | Assay detector labels |
| `public/model/` | Keras-derived classification model and four weight shards |
| `public/yolov8_model/` | YOLO graph model, three weight shards and original metadata |
| `server.js` | Local static server and model timestamp endpoint |
| `docs/REPRODUCIBILITY.md` | Model and processing details, validation status |
| `docs/KNOWN_ISSUES.md` | Observed defects retained for scientific traceability |
| `docs/AUTHOR_CHECKLIST.md` | Information and validation needed before submission |
| `docs/LICENSING.md` | Existing license declarations and unresolved ownership details |

## Integrity and provenance

```sh
python3 scripts/verify_package.py
```

The check validates package hashes and model weight sizes. It does not evaluate model accuracy or execute the app. `SHA256SUMS` identifies packaged files; `docs/original-file-checksums.json` records hashes before cleanup. This revision refactors the application and repairs runtime defects. Model files, dependency versions, class labels, numerical thresholds and the original preprocessing formulas are preserved. See `docs/REFACTOR_NOTES.md` for deliberate behavior changes and validation limits. Operating system metadata and dependency installations are excluded.

## Manuscript and license

Manuscript title, authors, journal, DOI, code archive DOI, contact details, and the exact version used for the paper were not supplied. See the author checklist before citing this package. The existing app and detector license declarations differ; see [Licensing](docs/LICENSING.md). No new license is granted by this cleanup.


This repository provides the NEIDx software accompanying the manuscript “Hardware-Free Testing for Antimicrobial Resistance Using Artificial Intelligence.”

Authors: Mert Tunca Doganay, Purbali Chakraborty, Abdullah Tozluyurt, Andrea M. Hujer, Stephen K. Obaro, Robert A. Bonomo, and Mohamed S. Draz.

Status: Under peer review. Publication details and a manuscript DOI will be added when available.

Contact

Software questions: Mert Tunca Doganay — mxt670@case.edu

Manuscript correspondence: Mohamed Draz — mxd665@case.edu
