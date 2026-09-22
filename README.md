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

Editable source doc: https://docs.google.com/document/d/1MsgLo_auKjnxbC5OEMan70R_FH8p7EzHvC7z9DwmTc8/edit?usp=sharing

Published source used by the website: https://docs.google.com/document/d/e/2PACX-1vQbbd27IH_bLefhDq0uu_RTxQq0S-WqH5Wk_iawjYdqaXKTiIoB1UHlBS3CN3i1IugfZRaVio5yttKq/pub

The app now uses the published-to-web Google Doc as the permanent live source. It first tries the published plain-text export, then the published HTML page, then the editable doc export, and finally the bundled snapshot in `shared/config.js` if Google blocks browser access.

If the published link ever changes:

1. Open the new published Google Doc URL.
2. Update `publishedDocUrl` and `publishedTextUrl` in `shared/config.js`.
3. Use the same URL in the staging footer links if needed.

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
