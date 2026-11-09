import test from "node:test";
import assert from "node:assert/strict";
import { fridayExceptions, fridayStatus, isOrderableFriday, isSchoolDay, orderableFridays, serveDateFor } from "../lib/schoolCalendar.ts";

test("ordinary Fridays are pizza Fridays", () => {
  assert.deepEqual(fridayStatus("2026-11-13"), { kind: "school", note: undefined });
  assert.equal(serveDateFor("2026-11-13"), "2026-11-13");
});

test("Thanksgiving, Christmas and spring break Fridays are skipped (Thursday is off too)", () => {
  for (const f of ["2026-11-27", "2026-12-25", "2027-01-01", "2027-03-26"]) {
    const s = fridayStatus(f);
    assert.equal(s.kind, "skipped", f);
    assert.equal(serveDateFor(f), null, f);
  }
  assert.equal(fridayStatus("2026-11-27").reason, "Thanksgiving break");
  assert.equal(fridayStatus("2027-01-01").reason, "Christmas break");
});

test("teacher planning Friday March 19 moves to Thursday March 18", () => {
  const s = fridayStatus("2027-03-19");
  assert.equal(s.kind, "moved");
  assert.equal(s.serveOn, "2027-03-18");
  assert.equal(s.reason, "Teacher planning day");
  assert.equal(s.note, "Early release");
  assert.equal(serveDateFor("2027-03-19"), "2027-03-18");
});

test("summer Fridays are not pizza Fridays", () => {
  assert.equal(fridayStatus("2027-06-04").kind, "summer");
  assert.equal(fridayStatus("2026-08-07").kind, "summer");
  assert.equal(fridayStatus("2027-05-28").kind, "school"); // last day for students
});

test("school day check honors weekends and closures", () => {
  assert.equal(isSchoolDay("2026-11-12"), true); // Thursday
  assert.equal(isSchoolDay("2026-11-14"), false); // Saturday
  assert.equal(isSchoolDay("2026-11-11"), false); // Veterans Day
  assert.equal(isSchoolDay("2027-01-04"), false); // planning day at the end of Christmas break
  assert.equal(isSchoolDay("2027-01-05"), true); // return from break
});

test("orderable Fridays drop skipped weeks but keep moved ones", () => {
  // From Nov 9, 2026, 8 weeks: Nov 13, 20, 27, Dec 4, 11, 18, 25, Jan 1
  assert.deepEqual(orderableFridays("2026-11-09", 8), ["2026-11-13", "2026-11-20", "2026-12-04", "2026-12-11", "2026-12-18"]);
  assert.equal(isOrderableFriday("2026-11-27", "2026-11-09", 8), false);
  assert.equal(isOrderableFriday("2026-12-04", "2026-11-09", 8), true);
  assert.equal(isOrderableFriday("2026-11-12", "2026-11-09", 8), false); // a Thursday is never the key
  assert.deepEqual(orderableFridays("2027-03-15", 2), ["2027-03-19"]); // moved week kept, spring break dropped
});

test("exception list covers the year", () => {
  const ex = fridayExceptions();
  const byDate = Object.fromEntries(ex.map((e) => [e.friday, e.status.kind]));
  assert.equal(byDate["2026-11-27"], "skipped");
  assert.equal(byDate["2026-12-25"], "skipped");
  assert.equal(byDate["2027-01-01"], "skipped");
  assert.equal(byDate["2027-03-19"], "moved");
  assert.equal(byDate["2027-03-26"], "skipped");
  assert.equal(byDate["2026-12-04"], "school"); // Christmas Show note
  assert.equal(byDate["2026-11-13"], undefined); // plain Friday not listed
});
