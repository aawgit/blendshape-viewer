# ARKit Blendshape Viewer

A browser-based tool for previewing ARKit facial blendshape coefficients on a 3D head model. Paste a 52-value coefficient array or adjust individual sliders to see the supported facial expressions on the included Ally head model.

**Live demo:** <https://akalanka.dev/blendshape-visualizer>

**Source repository:** <https://github.com/aawgit/blendshape-viewer>

The app also has an audio upload and playback UI. **Audio-to-blendshape generation is currently a placeholder**: uploaded audio is played while synthetic blendshape frames are generated locally. It does not call an inference service or derive facial animation from the audio.

## Run locally

This is a static ES-module app with no build step or package installation. Serve the repository root over HTTP (opening `index.html` directly may prevent module and model loading):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The app loads Three.js and its FBX loader from `esm.sh`, so an internet connection is required. A browser with WebGL support is also required.

## Use

- On startup, the viewer loads an example coefficient array.
- Paste an array into the text area and choose **Parse & Apply Blendshapes**. The expected order is the 52 ARKit coefficients listed in the **?** dialog.
- Use the model controls to change scale and rotation. Slider controls are disabled when the model does not provide a corresponding morph target.
- Upload a WAV, MP3, or M4A file to play it alongside the generated placeholder animation.

Values outside the slider range are clamped to 0–1 when applied. The model's existing attribution is shown below the viewer: the Ally Face Model by skullvez on Sketchfab.

## Project layout

- `index.html` — page structure and controls.
- `main.js` — app setup, model loading, and page-level event handlers.
- `threeScene.js` — Three.js scene, FBX loading, and model controls.
- `constants.js` — ARKit coefficient order and model morph-name mappings.
- `uiComponents.js` — slider, modal, and audio-upload UI.
- `blendshapeProcessor.js` — coefficient parsing, application, and summary stats.
- `audioProcessor.js` — audio playback and placeholder frame generation.
- `assets/` — included FBX model and its image asset.

## Development

There is no package manifest, build script, or automated test suite. For a basic local smoke check, serve the repository as above and confirm the model loads, sliders respond, and a 52-value array applies. Browser developer tools are useful for diagnosing module, network, or WebGL errors.

When replacing the placeholder audio processing, connect it to a real blendshape inference source and document its requirements; do not describe the current audio feature as speech-driven animation.
