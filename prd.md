---
doc: prd
status: draft
---
# Renewal Check — Product Requirements

A one-page renewal payment check for Canadian homeowners. Source: scope.md > The Unique Kernel.

## The Core Journey
1. The person opens the page and sees a short heading and a form already filled with an example, so results show right away.
2. They replace the example with their own numbers: balance at renewal, years left on the amortization, current rate, and the rate they've been offered. Payment frequency is monthly.
3. As they type, the results update: current payment, new payment, monthly change, and the "keep my payment" result.
4. A scenario table shows the offered rate minus 0.5, the offered rate, plus 1 and plus 2 points, each with payment and change.
5. Below, a short list of questions to ask the lender or a broker, and a note on switching lenders at renewal with a link to OSFI.
6. Success: they leave knowing the dollar change and whether keeping the old payment is possible.

## Screens and Layout
One page. Form on the left (top on phones), results on the right (below on phones), then the scenario table, then questions and the switch note.

## Look and Feel
Off-white background, dark ink text, one deep green accent. System fonts. Big clear numbers. No icons or stock art.

## Features and Behavior
- As a homeowner, I want my new payment at the offered rate so I can budget.
  - [ ] Payment uses semi-annual compounding, the usual convention for Canadian fixed-rate mortgages.
  - [ ] Results update without pressing a button.
- As a homeowner, I want to know what happens if I keep my current payment.
  - [ ] If the old payment covers more than the interest, show the new payoff time in years and months and the extra time versus today.
  - [ ] If it does not cover the interest, say so plainly and show the monthly shortfall versus interest.
- As a homeowner, I want to compare a few rates.
  - [ ] The table shows four rates around the offer, never below 0.

## States and Boundaries
- First use: example numbers filled in.
- Invalid input (blank, zero balance, amortization over 40 years, rate below 0 or above 25): the field is marked and results show a short message instead of numbers.
- Nothing is stored or sent anywhere. All maths runs in the browser.

## Product Decisions
- Monthly payments only for the POC, because that is what most statements show.
- No rate feed; the person types the rate they were offered.

## Added after first build (John's direction, Oct 15)
- Penalty estimator for leaving a closed term early: the higher of three months' interest or the IRD, with two IRD methods lenders use (posted rate minus original discount, as TD describes; lender's current rate with no discount, as ATB describes). Posted rates come from the Bank of Canada weekly series, including the posted rate in the month the person signed, so the discount is worked out for them.
  - [ ] Matches the FCAC worked example: $200,000 at 6%, 36 months left, 4% comparison gives $3,000 three months' interest and $12,000 IRD.
  - [ ] Variable rate uses three months' interest only.
- Shareable result: a link that carries only the four inputs, and a downloadable image card.
- French toggle, a navy and red colour option, keyboard and screen reader support, works on a phone.

## What We're Building
The form, live results, keep-my-payment result, scenario table, questions list, switch note with source link, and a disclaimer that this is an estimate, not advice.

## Deferred From the POC
Biweekly payments, prepayment privileges, lender-specific posted rate tables.

## Non-Goals
No lender ranking, no lead capture, no personal data collection.

## Open Questions
John to confirm the example numbers and the wording of the lender questions before submission.
