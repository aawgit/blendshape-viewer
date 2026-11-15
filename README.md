# ARKit Blendshape Viewer

A browser-based tool for previewing facial blendshapes on the included Ally head model or an uploaded 3D model. Paste a 52-value ARKit coefficient array or adjust individual sliders.

**Live demo:** <https://akalanka.dev/blendshape-visualizer>

**Source repository:** <https://github.com/aawgit/blendshape-viewer>

The app also has an audio upload and playback UI. **Audio-to-blendshape generation is currently a placeholder**: uploaded audio is played while synthetic blendshape frames are generated locally. It does not call an inference service or derive facial animation from the audio.

## Run locally

This is a static ES-module app with no build step or package installation. Serve the repository root over HTTP (opening `index.html` directly may prevent module and model loading):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The app loads Three.js, its model loaders, and the meshopt decoder from `esm.sh`, so an internet connection is required. A browser with WebGL support is also required.

## Use

- On startup, the viewer loads an example coefficient array.
- Choose one `.glb`, `.gltf`, or `.fbx` file under **Upload 3D Model** to replace the default model. If the model refers to separate textures or buffers, select those files at the same time; resource filenames must be unique. Files are read locally in your browser; external URLs are not loaded. glTF models using meshopt compression are supported, but Draco-compressed models are not.
- Paste an array into the text area and choose **Parse & Apply Blendshapes**. The expected order is the 52 ARKit coefficients listed in the **?** dialog.
- Use the model controls to change scale and rotation. ARKit sliders are disabled when the model does not provide a matching morph target. Targets with other names appear under **Other model blendshapes** and can be adjusted independently; they are not driven by ARKit arrays or audio.
- Upload a WAV, MP3, or M4A file to play it alongside the generated placeholder animation.

Matching ARKit targets across meshes are controlled together, regardless of their target indices. Values outside the slider range are clamped to 0–1 when applied. An uploaded model without morph targets can be viewed but cannot be animated using blendshapes. The default model's attribution is shown below the viewer: the Ally Face Model by skullvez on Sketchfab.

For example models, download [female bust 01](https://github.com/miroslavpejic85/mirotalksfu/raw/d35f1141d30ef519c8753a21f0e01dea726bd1dd/public/video-effects/assets/avatars-3d/woman/model.glb) or [female bust 11](https://github.com/miroslavpejic85/mirotalksfu/raw/d35f1141d30ef519c8753a21f0e01dea726bd1dd/public/video-effects/assets/avatars-3d/woman-2/model.glb). These lightweight GLBs have ARKit targets and are derived from [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) models under the MIT license; see the [asset license](https://github.com/miroslavpejic85/mirotalksfu/blob/d35f1141d30ef519c8753a21f0e01dea726bd1dd/public/video-effects/assets/avatars-3d/LICENSE.md).

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

There is no package manifest, build script, or automated test suite. For a basic local smoke check, serve the repository as above and confirm the default model loads, upload a model with blendshapes, adjust its sliders, and apply a 52-value array. Browser developer tools are useful for diagnosing module, network, or WebGL errors.

When replacing the placeholder audio processing, connect it to a real blendshape inference source and document its requirements; do not describe the current audio feature as speech-driven animation.
