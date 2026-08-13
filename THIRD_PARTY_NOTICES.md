# Third-Party Notices

This repository is licensed under the [MIT License](LICENSE). The files below are included under their respective MIT terms.

## Three.js

- **File:** `libs/three.min.js`
- **Component:** Three.js r160
- **Copyright:** 2010–2023 Three.js Authors
- **License:** MIT
- **Project:** <https://github.com/mrdoob/three.js>

The file carries the Three.js MIT license header and identifies revision `160` in its distribution.

## OrbitControls

- **File:** `libs/OrbitControlsGlobal.js`
- **Component:** locally adapted global wrapper based on the official Three.js `OrbitControls` example
- **Upstream project:** <https://github.com/mrdoob/three.js>
- **License:** MIT (the same upstream Three.js license)

This project changed the wrapper to work with the global `THREE` object. The exact upstream source commit was not recorded with the vendor file, so this notice does not claim an unverified upstream hash or version.

## Project-local files

`libs/react-simple.js` is project-local lightweight renderer code, not the React library. `libs/three-minimal.js` is a project-local legacy file and is not loaded by the customer page. Both are covered by this repository’s MIT license unless a file states otherwise.
