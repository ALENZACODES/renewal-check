// Mortgage maths for Renewal Check. Canadian fixed-rate convention: semi-annual compounding.

export function monthlyRate(annualPercent) {
  const i = annualPercent / 100;
  return Math.pow(1 + i / 2, 2 / 12) - 1;
}

export function payment(balance, annualPercent, years) {
  const n = Math.round(years * 12);
  const r = monthlyRate(annualPercent);
  if (r === 0) return balance / n;
  return (balance * r) / (1 - Math.pow(1 + r, -n));
}

// Months to pay off `balance` at a fixed monthly `pay`. Returns null if pay does not cover interest.
export function payoffMonths(balance, annualPercent, pay) {
  const r = monthlyRate(annualPercent);
  if (r === 0) return balance / pay;
  if (pay <= balance * r) return null;
  return -Math.log(1 - (balance * r) / pay) / Math.log(1 + r);
}

export function firstMonthInterest(balance, annualPercent) {
  return balance * monthlyRate(annualPercent);
}

export function validate({ balance, years, currentRate, offerRate }) {
  const errors = {};
  if (!(balance > 0)) errors.balance = "Enter a balance above zero.";
  if (!(years > 0 && years <= 40)) errors.years = "Enter between 1 month and 40 years.";
  for (const [k, v] of [["currentRate", currentRate], ["offerRate", offerRate]]) {
    if (!(v >= 0 && v <= 25)) errors[k] = "Enter a rate from 0 to 25%.";
  }
  return errors;
}

export function check({ balance, years, currentRate, offerRate }) {
  const currentPay = payment(balance, currentRate, years);
  const newPay = payment(balance, offerRate, years);
  const months = payoffMonths(balance, offerRate, currentPay);
  const scenarios = [-0.5, 0, 1, 2]
    .map((d) => Math.max(0, +(offerRate + d).toFixed(2)))
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((rate) => {
      const p = payment(balance, rate, years);
      return { rate, payment: p, change: p - currentPay };
    });
  return {
    currentPay,
    newPay,
    change: newPay - currentPay,
    keep: months === null
      ? { covers: false, interest: firstMonthInterest(balance, offerRate) }
      : { covers: true, months, extraMonths: months - years * 12 },
    scenarios,
  };
}

// ---------- Prepayment penalty (closed fixed-rate) ----------
// Sources: FCAC https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reduce-prepayment-penalties.html
// TD (posted rate minus original discount) https://apps.td.com/mortgage-prepayment-calculator/
// ATB (lender's current rate for the closest term, no discount) https://www.atb.com/siteassets/legacy/HowPenaltiesCalculated.pdf

export function threeMonthsInterest(balance, ratePercent) {
  return (balance * ratePercent) / 100 / 12 * 3;
}

// FCAC simplified IRD: A x (B - C) / 12 x D. Never negative.
export function ird(balance, contractRate, compareRate, monthsLeft) {
  return Math.max(0, (balance * (contractRate - compareRate)) / 100 / 12 * monthsLeft);
}

// Closest available posted term (1, 3 or 5 years) to the months left.
export function closestTerm(monthsLeft, terms = [1, 3, 5]) {
  const y = monthsLeft / 12;
  return terms.reduce((best, t) => (Math.abs(t - y) < Math.abs(best - y) ? t : best), terms[0]);
}

// method: "discount" (posted now minus original discount) or "current" (lender's current rate, no discount)
export function penalty({ balance, contractRate, monthsLeft, method, postedAtSigning, postedNowForTerm, lenderCurrentRate, variable = false }) {
  const tmi = threeMonthsInterest(balance, contractRate);
  if (variable) return { tmi, ird: 0, compareRate: null, discount: null, penalty: tmi, used: "tmi" };
  let compareRate, discount = null;
  if (method === "discount") {
    discount = Math.max(0, postedAtSigning - contractRate);
    compareRate = postedNowForTerm - discount;
  } else {
    compareRate = lenderCurrentRate;
  }
  const i = ird(balance, contractRate, compareRate, monthsLeft);
  return { tmi, ird: i, compareRate, discount, penalty: Math.max(tmi, i), used: i > tmi ? "ird" : "tmi" };
}

// ---------- Shareable state ----------
export const FIELDS = ["balance", "years", "currentRate", "offerRate"];
export function encodeState(v) {
  return FIELDS.map((k) => `${k[0]}=${encodeURIComponent(v[k])}`).join("&");
}
export function decodeState(query) {
  const p = new URLSearchParams(query);
  const out = {};
  for (const k of FIELDS) {
    const raw = p.get(k[0]);
    if (raw !== null && raw !== "" && Number.isFinite(+raw)) out[k] = +raw;
  }
  return out;
}
