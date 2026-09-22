# How to Help

**Live site:** [https://talrme.github.io/how-to-help/](https://talrme.github.io/how-to-help/)

A small family help-board for the newborn period after Avi's arrival. The root page contains five staging directions; each staging site uses the same data and interaction model but a different visual style.

## Staging Options

- `staging_1/` - Warm Fridge Door
- `staging_2/` - Care Command Center
- `staging_3/` - Garden Path
- `staging_4/` - Help Menu
- `staging_5/` - Orbit Board

## Google Doc Source

Source doc: https://docs.google.com/document/d/1MsgLo_auKjnxbC5OEMan70R_FH8p7EzHvC7z9DwmTc8/edit?usp=sharing

The app tries to read a live plain-text export from the Google Doc on page load. Browsers may block that because Google Docs exports are not always CORS-friendly. If the live fetch fails, the site uses the bundled snapshot in `shared/config.js`.

For a more reliable live setup:

1. Open the Google Doc.
2. Go to `File -> Share -> Publish to web`.
3. Publish as a document.
4. Copy the published URL.
5. Add `?output=txt` to the end if Google does not include it.
6. Paste that URL into `publishedTextUrl` in `shared/config.js`, or paste it into the site's Advanced settings on a specific device.

The expected document format is:

- Section heading on its own line, like `House stuff`.
- Bullets below each heading.
- Use `Title - details` when you want the website card to show a short title first and keep the details collapsed.

## Local Preview

Open `index.html` to choose among the five staging options. If live Google Doc fetching is blocked locally, the bundled snapshot still renders the page.

## Notes

- Stars and display settings are stored in browser `localStorage`.
- The QR code points to the live GitHub Pages URL.
- Placeholder images live in `assets/` and can be replaced later without code changes if filenames stay the same.
