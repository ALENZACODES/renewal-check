import test from "node:test";
import assert from "node:assert/strict";
import { T } from "../src/i18n.js";
import { POSTED, LATEST, ASOF } from "../src/rates.js";
import { readFileSync } from "node:fs";

test("English and French have the same keys and types", () => {
  assert.deepEqual(Object.keys(T.en).sort(), Object.keys(T.fr).sort());
  for (const k of Object.keys(T.en)) assert.equal(typeof T.en[k], typeof T.fr[k], k);
  assert.equal(T.en.q.length, T.fr.q.length);
});

test("every data-t key in the page exists in both languages", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const [, key] of html.matchAll(/data-t="([^"]+)"/g)) {
    assert.ok(key in T.en && key in T.fr, key);
  }
});

test("rates data is complete and plausible", () => {
  assert.match(ASOF, /^\d{4}-\d{2}-\d{2}$/);
  for (const term of ["1", "3", "5"]) {
    assert.ok(LATEST[term] > 0 && LATEST[term] < 20);
    const vals = Object.values(POSTED[term]);
    assert.ok(vals.length > 150);
    assert.ok(vals.every((v) => v > 0 && v < 20));
  }
});
