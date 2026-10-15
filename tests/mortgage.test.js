import test from "node:test";
import assert from "node:assert/strict";
import { monthlyRate, payment, payoffMonths, check, validate } from "../src/mortgage.js";

test("semi-annual monthly rate", () => {
  // 5% compounded semi-annually -> effective monthly 0.4123915%
  assert.ok(Math.abs(monthlyRate(5) - 0.004123915) < 1e-8);
});

test("payment, $100k 25y 5%", () => {
  // Known Canadian table value: about $581.60
  assert.ok(Math.abs(payment(100000, 5, 25) - 581.60) < 0.05);
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
