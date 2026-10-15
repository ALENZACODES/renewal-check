---
doc: spec
status: draft
---
# Renewal Check — Technical Spec

## How This Works, In Plain Language
It is a single web page. The page has a form and a small maths file. When a number changes, the maths file works out the payments and the page redraws the results. There is no server and nothing is saved.

## The Core Journey Through the System
Person types a number → index.html form fires an input event → app.js reads all fields and validates them → mortgage.js computes payments and payoff time → app.js writes results and the scenario table. PRD ref: prd.md > The Core Journey.

## Stack
Plain HTML, CSS and JavaScript (ES modules), no framework and no build step. Tests use Node's built-in test runner (node --test), Node 20 or later.

## Maths
- Monthly rate from an annual rate compounded twice a year: r = (1 + i/2)^(2/12) - 1.
- Payment: P = B r / (1 - (1 + r)^-n), n = years x 12. If r is 0, P = B / n.
- Payoff months at a fixed payment P: n = -ln(1 - B r / P) / ln(1 + r), defined only when P > B r. If P <= B r the payment does not cover interest.

## Where It Runs and How Someone Tries It
Any modern browser. Locally: python3 -m http.server in the project folder and open http://localhost:8000/. Hosted on GitHub Pages from the main branch root. Tests: node --test.

## Look and Feel
Background #faf8f3, text #1d2420, accent #1f5c45. System font stack. Results in large tabular numbers.

## Files
- index.html: layout and form.
- src/style.css: styles.
- src/mortgage.js: pure maths functions.
- src/app.js: reads the form and renders.
- tests/mortgage.test.js: maths tests.
