# How to Help

**Live site:** [https://talrme.github.io/how-to-help/](https://talrme.github.io/how-to-help/)

A small family help-board for the newborn period after Avi's arrival. The root page uses the simplified Option 2 direction: phone-first, minimal header, live Google Doc content, expandable details, and device-local item ordering.

## Site Structure

- `index.html` - production page
- `styles.css` - production page styling
- `shared/app.js` - shared parser, live Google Doc fetch, expansion, local settings, and local reordering

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
- Put `End` or `Website End` on its own line when the website should stop reading the doc. Anything below that line can stay in the Google Doc as notes without appearing on the site.

## Local Preview

Open `index.html` to preview the production page. If live Google Doc fetching is blocked locally, the bundled snapshot still renders the page.

## Notes

- Item order and display settings are stored in browser `localStorage`.
- The QR code points to the live GitHub Pages URL.
- Active website photos in `images/` are aggressively optimized small JPEGs for fast phone loading.
- Full-resolution photo originals are preserved locally in `images/originals/` in case future edits need them; that folder is intentionally ignored so those originals are not published.
