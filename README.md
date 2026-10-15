# Renewal Check

A one-page tool for Canadian homeowners whose mortgage term is ending. Type in your balance, years left, current rate and the rate you were offered. It shows your new payment and what happens if you keep paying what you pay now: how much longer the mortgage takes, or that the payment no longer covers the interest.

Live: https://alenzacodes.github.io/renewal-check/

## Run it
No install needed. Open the live link, or run locally:

    python3 -m http.server 8000

then open http://localhost:8000/.

## Tests
Needs Node 20 or later.

    node --test

## How the maths works
Canadian fixed-rate mortgages are usually calculated with interest compounded twice a year. The monthly rate is (1 + rate/2)^(1/6) - 1. The payment and payoff-time formulas are in `src/mortgage.js` and in `devpost/spec.md`.

## Planning documents
Built with the Devpost Learn Skill Pack for Build With AI: Basics. The plan is in `devpost/scope.md`, `devpost/prd.md` and `devpost/spec.md`.

## Sources
OSFI, Minimum qualifying rate for uninsured mortgages: https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/minimum-qualifying-rate-uninsured-mortgages

Estimates only, not financial advice.

## Licence
MIT. Copyright 2026 John Khan.
