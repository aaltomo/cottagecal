// Finnish public holidays for a given year. Dual-use: <script src> in the browser,
// require() in Node for the test. Returns [[Date, name], ...] in local time.

// Easter Sunday (Anonymous Gregorian algorithm / Computus).
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

function fiHolidays(y) {
  const off = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  const firstDow = (mon, from, to, dow) => { // first `dow` in [from,to] of month `mon`
    for (let d = from; d <= to; d++) { const dt = new Date(y, mon, d); if (dt.getDay() === dow) return dt; }
  };
  const e = easter(y);
  const list = [
    [new Date(y, 0, 1), "Uudenvuodenpäivä"],
    [new Date(y, 0, 6), "Loppiainen"],
    [off(e, -2), "Pitkäperjantai"],
    [e, "Pääsiäispäivä"],
    [off(e, 1), "2. pääsiäispäivä"],
    [new Date(y, 4, 1), "Vappu"],
    [off(e, 39), "Helatorstai"],
    [off(e, 49), "Helluntai"],
    [new Date(y, 11, 6), "Itsenäisyyspäivä"],
    [new Date(y, 11, 24), "Jouluaatto"],
    [new Date(y, 11, 25), "Joulupäivä"],
    [new Date(y, 11, 26), "Tapaninpäivä"],
  ];
  const juEve = firstDow(5, 19, 25, 5);          // Midsummer Eve: Friday, Jun 19–25
  list.push([juEve, "Juhannusaatto"], [off(juEve, 1), "Juhannuspäivä"]);
  const allSaints = firstDow(9, 31, 37, 6);       // Pyhäinpäivä: Saturday, Oct 31 – Nov 6
  list.push([allSaints, "Pyhäinpäivä"]);
  return list;
}

if (typeof module !== "undefined") module.exports = { easter, fiHolidays };
