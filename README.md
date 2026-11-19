model# ARKit Blendshape Viewer

A browser-based tool for previewing blendshapes on the included Ally head model or an uploaded 3D model. Adjust individual sliders to explore each shape.

**Live demo:** <https://akalanka.dev/blendshape-visualizer>

**Source repository:** <https://github.com/aawgit/blendshape-viewer>

## Run locally

This is a static ES-module app with no build step or package installation. Serve the repository root over HTTP (opening `index.html` directly may prevent module and model loading):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The app loads Three.js, its model loaders, and the meshopt decoder from `esm.sh`, so an internet connection is required. A browser with WebGL support is also required.

## Use

- Use **Choose Model Files** to select one `.glb`, `.gltf`, or `.fbx` file and replace the default model. If the model refers to separate textures or buffers, select those files at the same time; resource filenames must be unique. Files are read locally in your browser; external URLs are not loaded. glTF models using meshopt compression are supported, but Draco-compressed models are not.
- Use the model controls to change scale, rotation, and horizontal or vertical framing. ARKit sliders are disabled when the model does not provide a matching morph target. Targets with other names appear under **Other model blendshapes** and can be adjusted independently.

Matching targets across meshes are controlled together, regardless of their target indices. Sliders range from 0 to 1. An uploaded model without morph targets can be viewed but cannot be animated using blendshapes. The default model's attribution is shown below the viewer: the Ally Face Model by skullvez on Sketchfab.

Blendshapes (also called morph targets or shape keys) are built-in changes to a model's geometry. They can affect faces, bodies, or other objects; skeletal or bone animation is separate and is not controlled by these sliders. There is no universal naming convention: models may use ARKit names, FACS-inspired names, speech visemes, or custom names. The viewer recognizes ARKit names and some aliases, and exposes other targets by their model names.

The [test-models](./test-models/) folder contains Rocketbox busts and larger samples from other sources, ready to upload. See the [model inventory](./test-models/README.md) for licenses, sizes, and compatibility notes.

## Project layout

- `index.html` — page structure and controls.
- `main.js` — app setup, model loading, and page-level event handlers.
- `threeScene.js` — Three.js scene, FBX loading, and model controls.
- `constants.js` — ARKit coefficient order and model morph-name mappings.
- `uiComponents.js` — blendshape slider UI.
- `assets/` — included FBX model and its image asset.
- `test-models/` — example GLB models for testing uploads.

## Development

There is no package manifest, build script, or automated test suite. For a basic local smoke check, serve the repository as above and confirm the default model loads, upload a model with blendshapes, and adjust its sliders. Browser developer tools are useful for diagnosing module, network, or WebGL errors.
