# AI Notes - How to Help

## Project Intent

This is a static GitHub Pages website for sharing practical ways people can help Tal, Sophie, Miri, and Avi during the newborn period.

## Architecture

- Root `index.html` is the production page.
- Shared functionality lives in `shared/app.js`.
- Shared baseline styling lives in `shared/base.css`.
- Production styling lives in root `styles.css`.
- `shared/config.js` contains the Google Doc ID, permanent published URL, published text URL, live site URL, and fallback content snapshot.

## Content Rules

The Google Doc parser expects these headings:

- House stuff
- Miri Help
- Avi Help
- Sophie and Tal help
- Projects

Bullets are parsed as help cards. Text before the first ` - ` becomes the card title; text after it becomes collapsed detail text.

Put `End` or `Website End` on its own line in the Google Doc to stop website parsing. Any notes below that marker should remain visible in the doc but not render on the site.

## User Preferences

- Keep the site pretty, warm, and mobile-friendly.
- Use real family imagery when available and easy-to-replace placeholders elsewhere.
- Avoid big explanatory text blocks before the useful list.
- Keep the production page direct: title, image, sections, bottom QR/settings.
- The main `How to Help` title should stay on one line on phone and desktop.
- The hero subtitle should be one line under the main title: "Avi is here! We love you! Thank you!!"
- Keep mobile as the primary layout. On desktop, keep the help sections in a calm centered column; do not interleave photo strips as separate masonry/grid columns.
- Photo rows should sit under the section title for the following section, starting with the second section, rather than dangling at the bottom of the previous section.
- The `Miri Help` section photo row should use photos that include Miri.
- The hero uses a three-photo strip, not one large hero image. Current hero images are `hospital-family-bed.jpg`, `miri-and-avi-with-grandma.jpg`, and `miri-and-avi.jpg`.
- Settings should be local to the device.
- Keep a subtle link to the editable Google Doc in the Advanced settings area.
- Settings themes are Cozy, Bloom, and Night. Do not bring back the vague Bright option.
- Boolean settings should use modern slider-style toggles rather than plain checkboxes.
- Dark mode must keep modal controls readable, especially close buttons.
- All modals should close when clicking outside the panel, plus with Escape when practical.
- A QR-code modal should be available from the bottom controls.
- The bottom sharing control should follow the World Cup-style share pattern: link field, Copy button/status, QR card, and a save-to-phone details modal.
- Use root `help-icon.png` for the favicon, Apple touch icon, manifest icon, and save-to-phone/share modal app icons.
- Description-less list items should render as simple non-expandable rows.
- The old reorder handle UI was intentionally removed; do not show grabber lines on tasks unless Tal asks for reordering again.
- Photo thumbnails and the hero photo open a lightbox with next/previous navigation.

## Live Doc Caveat

Static GitHub Pages cannot authenticate to a private Google Doc. The browser reads the published-to-web version at https://docs.google.com/document/d/e/2PACX-1vQbbd27IH_bLefhDq0uu_RTxQq0S-WqH5Wk_iawjYdqaXKTiIoB1UHlBS3CN3i1IugfZRaVio5yttKq/pub; if Google blocks it in-browser, the bundled fallback snapshot keeps the page useful.
