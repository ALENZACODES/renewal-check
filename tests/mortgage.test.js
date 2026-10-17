import test from "node:test";
import assert from "node:assert/strict";
import { monthlyRate, payment, payoffMonths, check, validate } from "../src/mortgage.js";

test("semi-annual monthly rate", () => {
  // 5% compounded semi-annually -> effective monthly 0.4123915%
  assert.ok(Math.abs(monthlyRate(5) - 0.004123915) < 1e-8);
});

test("payment, $100k 25y 5%", () => {
  // Known Canadian table value: about $581.60
  assert.ok(Math.abs(payment(100000, 5, 25) - 581.6) < 0.05);
});

test("zero rate", () => {
  assert.equal(payment(120000, 0, 10), 1000);
});

test("payoff months round-trips payment", () => {
  const p = payment(400000, 4.49, 20);
  assert.ok(Math.abs(payoffMonths(400000, 4.49, p) - 240) < 1e-6);
});

test("payment below interest returns null", () => {
  assert.equal(payoffMonths(400000, 6, 1000), null);
});

test("check example", () => {
  const r = check({ balance: 400000, years: 20, currentRate: 2.29, offerRate: 4.49 });
  assert.ok(r.change > 0);
  assert.equal(r.keep.covers, true);
  assert.ok(r.keep.extraMonths > 0);
  assert.equal(r.scenarios.length, 4);
});

test("validate", () => {
  assert.deepEqual(validate({ balance: 1, years: 20, currentRate: 2, offerRate: 4 }), {});
  assert.ok(validate({ balance: 0, years: 50, currentRate: -1, offerRate: 30 }).balance);
});

import { threeMonthsInterest, ird, closestTerm, penalty, encodeState, decodeState } from "../src/mortgage.js";

test("FCAC worked example: $200k at 6%, 36 months left, 4% comparison", () => {
  assert.equal(threeMonthsInterest(200000, 6), 3000);
  assert.ok(Math.abs(ird(200000, 6, 4, 36) - 12000) < 1e-6);
  const p = penalty({ balance: 200000, contractRate: 6, monthsLeft: 36, method: "current", lenderCurrentRate: 4 });
  assert.equal(p.used, "ird");
  assert.ok(Math.abs(p.penalty - 12000) < 1e-6);
});

test("ATB worked example: $100k at 4% three months interest is $1,000", () => {
  assert.equal(threeMonthsInterest(100000, 4), 1000);
});

test("IRD never negative when rates rose", () => {
  assert.equal(ird(300000, 2, 5, 24), 0);
  const p = penalty({ balance: 300000, contractRate: 2, monthsLeft: 24, method: "current", lenderCurrentRate: 5 });
  assert.equal(p.used, "tmi");
});

test("posted-minus-discount method widens the IRD", () => {
  // posted 6.50 at signing, contract 4.50: discount 2.00. Posted now for 3y 6.05, so compare at 4.05.
  const withDisc = penalty({
    balance: 400000,
    contractRate: 4.5,
    monthsLeft: 36,
    method: "discount",
    postedAtSigning: 6.5,
    postedNowForTerm: 6.05,
  });
  const noDisc = penalty({
    balance: 400000,
    contractRate: 4.5,
    monthsLeft: 36,
    method: "current",
    lenderCurrentRate: 6.05,
  });
  assert.ok(withDisc.discount > 0);
  assert.ok(withDisc.penalty > noDisc.penalty);
});

test("variable rate uses three months interest only", () => {
  const p = penalty({ balance: 250000, contractRate: 5, monthsLeft: 40, variable: true });
  assert.equal(p.penalty, threeMonthsInterest(250000, 5));
});

test("closest term", () => {
  assert.equal(closestTerm(10), 1);
  assert.equal(closestTerm(30), 3);
  assert.equal(closestTerm(50), 5);
});

test("share state round-trips and ignores junk", () => {
  const v = { balance: 400000, years: 20, currentRate: 2.29, offerRate: 4.49 };
  assert.deepEqual(decodeState(encodeState(v)), v);
  assert.deepEqual(decodeState("b=abc&y=&c=3"), { currentRate: 3 });
});

test("payment always positive and finite across a grid", () => {
  for (const b of [1000, 250000, 2000000])
    for (const y of [1, 10, 25, 40])
      for (const r of [0, 0.5, 5, 12, 25]) {
        const p = payment(b, r, y);
        assert.ok(Number.isFinite(p) && p > 0, `${b} ${y} ${r}`);
        assert.ok(Math.abs(payoffMonths(b, r, p) - y * 12) < 1e-6);
      }
});
