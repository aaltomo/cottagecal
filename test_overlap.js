// Run: node test_overlap.js  — checks the booking-conflict rule and the off-season block.
const assert = require("assert");
const { overlaps, rangeHasClosedDay } = require("./server");

const r = (start, end) => ({ start, end });
assert(overlaps(r("2026-07-01", "2026-07-05"), r("2026-07-05", "2026-07-09")), "touch at boundary = clash");
assert(overlaps(r("2026-07-01", "2026-07-10"), r("2026-07-03", "2026-07-04")), "fully contained = clash");
assert(!overlaps(r("2026-07-01", "2026-07-05"), r("2026-07-06", "2026-07-09")), "adjacent, no gap = free");
assert(!overlaps(r("2026-07-10", "2026-07-12"), r("2026-07-01", "2026-07-05")), "disjoint = free");

// Off-season = Nov–Mar closed.
assert(!rangeHasClosedDay("2026-07-11", "2026-07-13"), "midsummer = open");
assert(!rangeHasClosedDay("2026-04-01", "2026-10-31"), "whole open season = open");
assert(rangeHasClosedDay("2026-12-10", "2026-12-12"), "December = closed");
assert(rangeHasClosedDay("2026-01-02", "2026-01-03"), "January = closed");
assert(rangeHasClosedDay("2026-10-30", "2026-11-02"), "Oct→Nov crossing catches the closed tail");
console.log("ok");
