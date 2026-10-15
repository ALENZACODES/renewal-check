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

## Penalty maths
- Three months' interest: balance x rate / 12 x 3.
- IRD (FCAC formula): balance x (contract rate - comparison rate) / 12 x months left, never below zero.
- Comparison rate, discount method: Bank of Canada posted rate for the closest term (1, 3 or 5 years) today, minus (posted 5-year rate in the signing month - contract rate).
- Comparison rate, current-rate method: the lender's current rate typed by the person.
- Data: src/rates.js, first weekly value each month of series V80691333, V80691334, V80691335 from the Bank of Canada Valet API.

## Sharing
URL query b, y, c, o holds the four renewal inputs. Canvas draws a 1200 x 630 card for download.

## Where It Runs and How Someone Tries It
Any modern browser. Locally: python3 -m http.server in the project folder and open http://localhost:8000/. Hosted on GitHub Pages from the main branch root. Tests: node --test.

## Look and Feel
Background #faf8f3, text #1d2420, accent #1f5c45. System font stack. Results in large tabular numbers.

## Files
- index.html: layout and form.
- src/style.css: styles.
- src/mortgage.js: pure maths functions.
- src/app.js: reads the forms, renders, handles language, theme and sharing.
- src/i18n.js: English and French text.
- src/rates.js: Bank of Canada posted rates.
- tests/mortgage.test.js: maths tests.
