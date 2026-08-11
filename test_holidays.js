// Run: node test_holidays.js — checks the Easter computus and derived Finnish holidays.
const assert = require("assert");
const { easter, fiHolidays } = require("./holidays");

const md = (d) => `${d.getMonth() + 1}-${d.getDate()}`;
// Known Easter Sundays.
assert.equal(md(easter(2024)), "3-31");
assert.equal(md(easter(2025)), "4-20");
assert.equal(md(easter(2026)), "4-5");

const byName = (y) => Object.fromEntries(fiHolidays(y).map(([d, n]) => [n, d]));
const h = byName(2026);
assert.equal(md(h["Pitkäperjantai"]), "4-3");    // Easter - 2
assert.equal(md(h["2. pääsiäispäivä"]), "4-6");  // Easter + 1
assert.equal(md(h["Helatorstai"]), "5-14");      // Easter + 39
assert.equal(md(h["Itsenäisyyspäivä"]), "12-6");
assert.equal(h["Juhannusaatto"].getDay(), 5);    // always a Friday
assert.equal(h["Juhannuspäivä"].getDay(), 6);    // always a Saturday
assert.equal(h["Pyhäinpäivä"].getDay(), 6);      // always a Saturday
assert.ok(md(h["Juhannusaatto"]) >= "6-19" && md(h["Juhannusaatto"]) <= "6-25");
console.log("ok");
