import { check, validate, penalty, closestTerm, encodeState, decodeState, FIELDS } from "./mortgage.js";
import { POSTED, LATEST, ASOF } from "./rates.js";
import { T } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const qs = new URLSearchParams(location.search);
let lang =
  qs.get("lang") || localStorage.getItem("rc-lang") || ((navigator.language || "").startsWith("fr") ? "fr" : "en");
if (!T[lang]) lang = "en";
let penn = qs.get("theme") === "navy" || localStorage.getItem("rc-penn") === "1";
const t = () => T[lang];
const loc = () => (lang === "fr" ? "fr-CA" : "en-CA");
const money = (n) => n.toLocaleString(loc(), { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const signed = (n) => (n >= 0 ? "+" : "−") + money(Math.abs(n));
const num = (n) => n.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => num(n) + (lang === "fr" ? "\u00a0%" : "%");
const ym = (m) => {
  const tot = Math.round(m),
    y = Math.floor(tot / 12),
    r = tot % 12;
  return r ? `${t().yr(y)}, ${t().mo(r)}` : t().yr(y);
};
let last = null;

function applyText() {
  root.lang = lang === "fr" ? "fr-CA" : "en-CA";
  document.querySelectorAll("[data-t]").forEach((el) => {
    const v = t()[el.dataset.t];
    if (typeof v === "string") el.textContent = v;
  });
  $("langBtn").textContent = t().lang;
  $("langBtn").lang = lang === "fr" ? "en" : "fr";
  $("themeBtn").textContent = penn ? t().themeOff : t().theme;
  $("themeBtn").setAttribute("aria-pressed", String(penn));
  root.classList.toggle("penn", penn);
  $("qs").innerHTML = t()
    .q.map((q) => `<li>${q}</li>`)
    .join("");
  document.title = `${t().title}`;
}

function readMain() {
  return Object.fromEntries(FIELDS.map((k) => [k, parseFloat($(k).value)]));
}

function render() {
  const v = readMain();
  const errors = validate(v);
  FIELDS.forEach((k) => {
    $(k).setAttribute("aria-invalid", errors[k] ? "true" : "false");
    document.querySelector(`[data-for=${k}]`).textContent = errors[k] ? t().err[k] : "";
  });
  if (Object.keys(errors).length) {
    $("results").innerHTML = `<p>${t().fix}</p>`;
    $("scen").innerHTML = "";
    last = null;
    drawCard();
    return;
  }
  const r = check(v);
  last = { v, r };
  const keep = r.keep.covers
    ? `<div class="keep">${t().keepOk(money(r.currentPay), ym(r.keep.months), ym(v.years * 12), ym(Math.max(0, r.keep.extraMonths)))}
       <div class="bar-chart" aria-hidden="true"><span style="width:${((100 * v.years * 12) / r.keep.months).toFixed(1)}%"></span><span style="width:${(100 - (100 * v.years * 12) / r.keep.months).toFixed(1)}%"></span></div></div>`
    : `<div class="keep bad">${t().keepBad(money(r.currentPay), num(v.offerRate), money(r.keep.interest))}</div>`;
  $("results").innerHTML = `
    <p class="label">${t().newPay} ${pct(v.offerRate)}</p>
    <p class="big">${money(r.newPay)}</p>
    <div class="row"><span>${t().now} (${pct(v.currentRate)})</span><span>${money(r.currentPay)}</span></div>
    <div class="row"><span>${t().perMonth}</span><b>${signed(r.change)}</b></div>
    <div class="row"><span>${t().perYear}</span><b>${signed(r.change * 12)}</b></div>${keep}`;
  $("scen").innerHTML = r.scenarios
    .map(
      (s) =>
        `<tr class="${Math.abs(s.rate - v.offerRate) < 1e-9 ? "offer" : ""}"><td>${pct(s.rate)}</td><td>${money(s.payment)}</td><td>${signed(s.change)}</td></tr>`,
    )
    .join("");
  history.replaceState(null, "", `?${encodeState(v)}${lang === "fr" ? "&lang=fr" : ""}${penn ? "&theme=navy" : ""}`);
  drawCard();
}

function postedAt(ym, term) {
  const series = POSTED[String(term)];
  if (series[ym] !== undefined) return series[ym];
  const keys = Object.keys(series).sort();
  return series[keys.filter((k) => k <= ym).pop() || keys[0]];
}

function renderPenalty() {
  const balance = +$("pBalance").value,
    contractRate = +$("pRate").value,
    monthsLeft = +$("pMonths").value;
  const signedYm = $("pSigned").value || "2024-10";
  const variable = document.querySelector("input[name=ptype]:checked").value === "variable";
  const method = document.querySelector("input[name=method]:checked").value;
  $("methodSet").hidden = variable;
  $("compareWrap").hidden = variable || method !== "current";
  if (!(balance > 0 && contractRate >= 0 && contractRate <= 25 && monthsLeft > 0 && monthsLeft <= 120)) {
    $("presults").innerHTML = `<p>${t().fix}</p>`;
    return;
  }
  const term = closestTerm(monthsLeft);
  const postedAtSigning = postedAt(signedYm, 5);
  const p = penalty({
    balance,
    contractRate,
    monthsLeft,
    method,
    variable,
    postedAtSigning,
    postedNowForTerm: LATEST[String(term)],
    lenderCurrentRate: +$("pCompare").value,
  });
  const lines = variable
    ? ""
    : `
    <div class="row"><span>${t().irdL}</span><span>${money(p.ird)}</span></div>
    ${method === "discount" ? `<p class="note">${t().discountL(num(p.discount), num(postedAtSigning))}</p>` : ""}
    <p class="note">${t().compareL(num(p.compareRate), term)}</p>`;
  $("presults").innerHTML = `<p class="label">${t().est}</p><p class="big">${money(p.penalty)}</p>
    <div class="row"><span>${t().tmi}</span><span>${money(p.tmi)}</span></div>${lines}`;
  $("pNote").textContent = t().pNote(ASOF);
}

function drawCard() {
  const c = $("cardCanvas"),
    g = c.getContext("2d");
  const css = getComputedStyle(root),
    a = css.getPropertyValue("--accent").trim(),
    a2 = css.getPropertyValue("--accent2").trim();
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = a;
  g.fillRect(0, 0, 1200, 120);
  g.fillStyle = a2;
  g.fillRect(0, 120, 1200, 10);
  g.fillStyle = "#fff";
  g.font = "700 46px system-ui, sans-serif";
  g.fillText(t().cardHead, 60, 78);
  if (!last) return;
  const { v, r } = last;
  g.fillStyle = "#555";
  g.font = "32px system-ui, sans-serif";
  g.fillText(`${pct(v.currentRate)} → ${pct(v.offerRate)}  ·  ${money(v.balance)}`, 60, 200);
  g.fillStyle = a;
  g.font = "800 110px system-ui, sans-serif";
  g.fillText(money(r.newPay), 60, 330);
  g.fillStyle = a2;
  g.font = "700 44px system-ui, sans-serif";
  g.fillText(`${signed(r.change)} / ${lang === "fr" ? "mois" : "month"}`, 60, 400);
  g.fillStyle = "#222";
  g.font = "36px system-ui, sans-serif";
  const keepTxt = r.keep.covers ? `${ym(Math.max(0, r.keep.extraMonths))} ${t().cardLonger}` : t().cardNo;
  g.fillText(`${t().cardKeep} ${keepTxt}`, 60, 480);
  g.fillStyle = "#777";
  g.font = "26px system-ui, sans-serif";
  g.fillText("alenzacodes.github.io/renewal-check", 60, 580);
}

// Wire up
const fromUrl = decodeState(location.search);
FIELDS.forEach((k) => {
  if (fromUrl[k] !== undefined) $(k).value = fromUrl[k];
});
$("offerSlide").value = $("offerRate").value;
FIELDS.forEach((k) =>
  $(k).addEventListener("input", () => {
    if (k === "offerRate") $("offerSlide").value = $(k).value;
    render();
  }),
);
$("offerSlide").addEventListener("input", () => {
  $("offerRate").value = (+$("offerSlide").value).toFixed(2);
  render();
});
document.querySelectorAll("#pf input").forEach((el) => el.addEventListener("input", renderPenalty));
$("pSigned").max = ASOF.slice(0, 7);
$("langBtn").addEventListener("click", () => {
  lang = lang === "en" ? "fr" : "en";
  localStorage.setItem("rc-lang", lang);
  applyText();
  render();
  renderPenalty();
});
$("themeBtn").addEventListener("click", () => {
  penn = !penn;
  localStorage.setItem("rc-penn", penn ? "1" : "0");
  applyText();
  render();
});
$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    $("copied").textContent = t().copied;
  } catch {
    $("copied").textContent = location.href;
  }
});
$("dlBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "renewal-check.png";
  link.href = $("cardCanvas").toDataURL("image/png");
  link.click();
});
applyText();
render();
renderPenalty();
