import { check, validate } from "./mortgage.js";

const ids = ["balance", "years", "currentRate", "offerRate"];
const $ = (id) => document.getElementById(id);
const money = (n) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const signed = (n) => (n >= 0 ? "+" : "-") + money(Math.abs(n));
const ym = (m) => {
  const t = Math.round(m), y = Math.floor(t / 12), r = t % 12;
  return `${y} year${y === 1 ? "" : "s"}${r ? `, ${r} month${r === 1 ? "" : "s"}` : ""}`;
};

function render() {
  const v = Object.fromEntries(ids.map((k) => [k, parseFloat($(k).value)]));
  const errors = validate(v);
  ids.forEach((k) => {
    $(k).setAttribute("aria-invalid", errors[k] ? "true" : "false");
    document.querySelector(`[data-for=${k}]`).textContent = errors[k] || "";
  });
  if (Object.keys(errors).length) {
    $("results").innerHTML = "<p>Fix the highlighted field to see your numbers.</p>";
    $("scen").innerHTML = "";
    return;
  }
  const r = check(v);
  const keep = r.keep.covers
    ? `<div class="keep"><strong>If you keep paying ${money(r.currentPay)} a month</strong>, the mortgage takes ${ym(r.keep.months)} to pay off instead of ${ym(v.years * 12)}. That is ${ym(Math.max(0, r.keep.extraMonths))} longer.</div>`
    : `<div class="keep bad"><strong>Your current payment of ${money(r.currentPay)} would not cover the interest</strong> at ${v.offerRate}%. Interest alone is about ${money(r.keep.interest)} in the first month, so the balance would grow.</div>`;
  $("results").innerHTML = `
    <p>New monthly payment at ${v.offerRate}%</p>
    <p class="big">${money(r.newPay)}</p>
    <div class="row"><span>What you pay now (${v.currentRate}%)</span><span>${money(r.currentPay)}</span></div>
    <div class="row"><span>Change per month</span><span>${signed(r.change)}</span></div>
    <div class="row"><span>Change per year</span><span>${signed(r.change * 12)}</span></div>
    ${keep}`;
  $("scen").innerHTML = r.scenarios.map((s) =>
    `<tr class="${s.rate === +v.offerRate.toFixed(2) ? "offer" : ""}"><td>${s.rate.toFixed(2)}%</td><td>${money(s.payment)}</td><td>${signed(s.change)}</td></tr>`).join("");
}

ids.forEach((k) => $(k).addEventListener("input", render));
render();
