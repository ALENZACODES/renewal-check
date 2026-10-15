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
