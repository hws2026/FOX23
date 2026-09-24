# Gridiron — one-batch GitHub Pages upload

1. Extract this ZIP. In an empty GitHub repository, choose **Add file → Upload files**. Drag **all the extracted contents**, including `index.html` and the `assets` folder, into the upload area together. Commit once. Do not upload the ZIP itself or an extra enclosing folder.
2. Open **Settings → Pages**. Choose **Deploy from a branch**, **main**, **/(root)**, then Save.
3. Open the published URL. In the panel, click **Download Stream Deck plugin** to get your site-configured installer. Install it, then drag the Gridiron actions onto your keys.

No terminal, npm install, Python installation or build command is required to use this upload. First load downloads the browser runtime. This folder contains the complete running site's HTML, CSS, JS, and Python control rules.

OBS: use **Output & files**, open the magenta output in the same browser profile, and Window Capture it with a magenta Chroma Key filter. An ordinary OBS Browser Source does not share your browser's saved state. **Pair OBS** is experimental and unverified on hardware.

Import your exported show under Output & files. Local saves are browser-specific; export backups. Keep the control panel open. The Stream Deck v2 plugin connects directly to the panel and does not open command tabs.

For the full development repository and rebuild script, use the separate full-source ZIP. Do not replace this upload with the full-source folder unless you follow its docs/ deployment instructions.


## Stream Deck v2 — direct control, no windows

After uploading this update, reload the control panel on the broadcast PC. Click **Download Stream Deck plugin** there and install it, replacing version 1. Then click **Connect Stream Deck** once; allow local-network access if the browser asks. Wait for **Stream Deck connected**. The plugin and panel must run on the same PC and use the site/profile from which you downloaded the installer.

Commands now travel over an authenticated loopback connection on port 18765. No command opens a tab/window or invokes a browser URL. If disconnected, the key shows an error; commands are not queued for later replay. Old System → Website buttons still open windows: replace those with Gridiron actions. Existing Gridiron v1 actions keep their identifiers when upgrading.

135 presets cover scores, timeouts, clocks, possession, bottom-data visibility, down/distance, quarters/statuses, all available graphics by team, lineups, transition modes, and editable numeric/text values. Choose **Configurable control** for a dropdown of all presets; value controls have an editable Value field. **Advanced · any controller action** exposes the complete API with JSON payloads for less common edits. File pickers/uploads remain in the browser panel.

The plugin shares the panel's Take/lineup automation. Advanced reset/import actions still require their normal confirmation fields. No hardware key layout is overwritten.

Tested: direct browser score update and acknowledgement with no new tabs, lineup Take, token/origin rejection, and Elgato CLI package validation. Physical Stream Deck and HTTPS localhost permission behavior must be checked on your PC. If the connection is blocked, allow this site's local-network access; do not disable browser security. There is no window-opening fallback.
