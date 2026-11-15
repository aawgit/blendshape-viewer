# Agent instructions

## Project context

This repository is a small static browser app for applying ARKit facial blendshape values to a Three.js FBX head model. Read `README.md` for setup, user behavior, and current limitations. In particular, audio upload currently creates synthetic animation frames; there is no inference API.

## Working conventions

- Keep the app dependency-light and compatible with the existing browser-native ES modules. There is no package manager, bundler, or test framework configured.
- Keep the ARKit coefficient ordering in `constants.js` consistent with the help dialog, example input, and slider index mapping.
- Preserve the included model's attribution in `index.html`.
- Avoid adding dependencies or changing the project's architecture for a narrow fix.
- Update `README.md` when user-facing behavior, setup, or limitations change.

## Validation

For code changes, serve the repository root with `python3 -m http.server 8000` and check the app in a WebGL-capable browser. Verify the relevant UI interaction and check the browser console for errors. There is currently no automated test or build command.
