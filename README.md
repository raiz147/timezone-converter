# Timezone Converter

Simple browser-based timezone converter built with vanilla HTML, CSS, and JavaScript.

## Features
- Converts a chosen date/time from one timezone to another
- Uses IANA timezones (via `Intl.supportedValuesOf("timeZone")` when available)
- Handles daylight saving transitions via timezone-aware conversion logic
- Swap button for quick source/target timezone switching

## Run
Open `index.html` in any modern browser.

## Files
- `index.html` UI markup
- `style.css` styles and responsive layout
- `script.js` timezone data + conversion logic