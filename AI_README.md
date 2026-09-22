# AI Notes - How to Help

## Project Intent

This is a static GitHub Pages website for sharing practical ways people can help Tal, Sophie, Miri, and Avi during the newborn period.

## Architecture

- Root `index.html` is the production page based on the simplified Option 2 direction.
- `staging_1` through `staging_5` are five independent visual directions.
- Shared functionality lives in `shared/app.js`.
- Shared baseline styling lives in `shared/base.css`.
- Production styling lives in root `styles.css`.
- Each staging folder has its own `styles.css` with the visual treatment.
- `shared/config.js` contains the Google Doc ID, permanent published URL, published text URL, live site URL, and fallback content snapshot.

## Content Rules

The Google Doc parser expects these headings:

- House stuff
- Miri Help
- Avi Help
- Sophie and Tal help
- Projects

Bullets are parsed as help cards. Text before the first ` - ` becomes the card title; text after it becomes collapsed detail text.

## User Preferences

- Keep the site pretty, warm, and mobile-friendly.
- Use real family imagery when available and easy-to-replace placeholders elsewhere.
- Avoid big explanatory text blocks before the useful list.
- Keep the production page direct: title, image, sections, bottom QR/settings.
- Settings should be local to the device.
- A QR-code modal should be available from the bottom controls.
- Item reordering is saved locally per device in `localStorage`.

## Live Doc Caveat

Static GitHub Pages cannot authenticate to a private Google Doc. The browser reads the published-to-web version at https://docs.google.com/document/d/e/2PACX-1vQbbd27IH_bLefhDq0uu_RTxQq0S-WqH5Wk_iawjYdqaXKTiIoB1UHlBS3CN3i1IugfZRaVio5yttKq/pub; if Google blocks it in-browser, the bundled fallback snapshot keeps the page useful.
