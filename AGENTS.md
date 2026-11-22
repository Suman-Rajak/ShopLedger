# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Node.js/Express POS and Khata ledger app. `server.js` wires the app and serves `public/`; `routes/` contains the product, order, customer, and reporting endpoints. Business logic lives in `lib/` (pricing, tax, coupons, inventory, ledger, orders, invoices, reports, dates, and JSON storage). Shop settings and GST/coupon definitions are in `config.js`. The local data store is `data/db.json`. Browser assets are under `public/` (`index.html`, `js/`, and `css/`); the architecture diagram is in `docs/`. No test directory or test framework is currently present.

## Build, Test, and Development Commands

- `npm start` runs the app with `node server.js` (default port 3000; override with `PORT`).
- There is no build script.
- `npm test` currently prints “Error: no test specified” and exits unsuccessfully; do not treat it as a passing test suite. If you change behavior, describe any manual checks performed and add automated tests when a test framework is introduced.

## Coding Style & Naming Conventions

Follow the existing CommonJS style: `require()` imports, `module.exports`/`exports`, two-space indentation, semicolons, and single-quoted strings. Use lower camel case for functions and variables; use descriptive lowercase filenames such as `pricing.js` and `orders.js`. Keep route handlers thin and place reusable business rules in `lib/`. Preserve consistent two-decimal rounding for monetary calculations and avoid duplicating checkout rules in invoice or report code.

## Testing Guidelines

No framework, test files, or coverage threshold are configured. For changes to checkout, GST, coupons, Khata, inventory, or invoice totals, review both the relevant library and its route/report consumers. Include concrete examples and results in the pull request until automated coverage exists. Do not claim `npm test` passed; it is a placeholder that exits with an error.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive, lowercase summaries (for example, `customer khata credit ledger and order cancellation`). Follow that pattern and keep each commit focused. Pull requests should explain the user-visible and data impacts, list validation performed, link a related issue when one exists, and include screenshots for browser UI changes.

## Security & Configuration

Do not commit real customer or payment data, credentials, or secrets. `data/db.json` may contain sensitive records; use safe fixtures for examples. Review `config.js` before deployment because it contains shop details, coupon/tax settings, and an admin key. Back up the JSON data before any migration or manual change.
