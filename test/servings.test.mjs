import test from "node:test";
import assert from "node:assert/strict";
import { GRADES, isElementary, servingLabel, slicesPerServing } from "../lib/menu.ts";
import { toRows } from "../lib/admin.ts";

test("K through 6th get two slices, the younger rooms one", () => {
  for (const g of ["K", "1st", "2nd", "3rd", "4th", "5th", "6th"]) assert.equal(slicesPerServing(g), 2, g);
  for (const g of ["1 Year Old Room", "2 Year Old Room", "3 Year Old Room", "VPK Room"]) assert.equal(slicesPerServing(g), 1, g);
  assert.equal(slicesPerServing(undefined), 1);
  assert.equal(servingLabel("3rd"), "two slices");
  assert.equal(servingLabel("VPK Room"), "one slice");
  assert.ok(GRADES.every((g) => typeof isElementary(g) === "boolean"));
});

test("staff rows count delivered slices, not servings", () => {
  const base = { provider: "stripe", sessionId: "cs_1", status: "paid", mode: "payment", totalCents: 1200, currency: "usd", pickupDate: "2026-11-13", lines: [{ name: "One Friday", qty: 2, unitCents: 600 }] };
  const [vpk] = toRows([{ ...base, customer: { name: "A", student: "S", grade: "VPK Room", classroom: "R" } }]);
  const [fifth] = toRows([{ ...base, customer: { name: "A", student: "S", grade: "5th", classroom: "R" } }]);
  assert.equal(vpk.slices, 2);
  assert.equal(fifth.slices, 4);
});
