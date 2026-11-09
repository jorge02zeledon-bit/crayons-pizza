/**
 * Crayons Christian School calendar, 2026-27, as it affects Pizza Friday.
 *
 * Rule: if there is no school on a Friday, slices are delivered the Thursday
 * before, as long as that Thursday is a school day. If the Thursday is also
 * off (a long break), there is no pizza day that week. Outside the school
 * year there are no pizza days.
 *
 * Source: "Crayons Christian School 2026-2027 School Year Calendar" (color
 * calendar, pages for August 2026 to July 2027). Dates are subject to change
 * by the school; edit CLOSURES and DAY_NOTES when they do.
 */
import { addDays, isFriday, isISODate, selectableFridays, weekday, type ISODate } from "./fridays.ts";

export const SCHOOL_YEAR = {
  label: "2026-27",
  firstDay: "2026-08-10", // First Day of School
  lastDay: "2027-05-28", // Graduation, Last Day for Students
} as const;

type Closure = { from: ISODate; to: ISODate; label: string };

/** Every day students are not in school (No School and Teacher Planning days). Inclusive ranges. */
export const CLOSURES: readonly Closure[] = [
  { from: "2026-09-07", to: "2026-09-07", label: "Labor Day" },
  { from: "2026-09-21", to: "2026-09-21", label: "Teacher planning day" },
  { from: "2026-10-12", to: "2026-10-12", label: "Teacher planning day" },
  { from: "2026-11-03", to: "2026-11-03", label: "Teacher planning day" },
  { from: "2026-11-11", to: "2026-11-11", label: "Veterans Day" },
  { from: "2026-11-23", to: "2026-11-27", label: "Thanksgiving break" },
  { from: "2026-12-21", to: "2027-01-04", label: "Christmas break" },
  { from: "2027-01-18", to: "2027-01-18", label: "Martin Luther King Jr. Day" },
  { from: "2027-02-15", to: "2027-02-15", label: "Presidents' Day" },
  { from: "2027-03-10", to: "2027-03-10", label: "Schools closed" },
  { from: "2027-03-19", to: "2027-03-19", label: "Teacher planning day" },
  { from: "2027-03-22", to: "2027-03-26", label: "Spring break" },
  { from: "2027-05-31", to: "2027-05-31", label: "Memorial Day" },
];

/** School days worth a heads-up on the pizza calendar. Pizza is still served on these. */
export const DAY_NOTES: Readonly<Record<ISODate, string>> = {
  "2026-10-09": "Early release",
  // The printed calendar also marks Dec 3, 10 and 11 as Christmas Show days; the school confirmed the show is Dec 4 only.
  "2026-12-04": "Christmas Show",
  "2026-12-18": "Christmas party, early release",
  "2027-02-12": "Valentine's Day celebration, early release",
  "2027-03-18": "Early release",
  "2027-05-28": "Graduation, last day for students",
};

export type FridayStatus =
  | { kind: "school"; note?: string }
  | { kind: "moved"; serveOn: ISODate; reason: string; note?: string }
  | { kind: "skipped"; reason: string }
  | { kind: "summer" };

export function closureOn(day: ISODate): Closure | undefined {
  return CLOSURES.find((c) => day >= c.from && day <= c.to);
}

export function inSchoolYear(day: ISODate): boolean {
  return day >= SCHOOL_YEAR.firstDay && day <= SCHOOL_YEAR.lastDay;
}

/** A weekday inside the school year with no closure. */
export function isSchoolDay(day: ISODate): boolean {
  const w = weekday(day);
  return inSchoolYear(day) && w >= 1 && w <= 5 && !closureOn(day);
}

/** What happens to Pizza Friday on a given Friday. */
export function fridayStatus(friday: ISODate): FridayStatus {
  if (!inSchoolYear(friday)) return { kind: "summer" };
  const closure = closureOn(friday);
  if (!closure) return { kind: "school", note: DAY_NOTES[friday] };
  const thursday = addDays(friday, -1);
  if (isSchoolDay(thursday)) return { kind: "moved", serveOn: thursday, reason: closure.label, note: DAY_NOTES[thursday] };
  return { kind: "skipped", reason: closure.label };
}

/** The day slices are actually delivered for a chosen Friday, or null when there is no pizza day that week. */
export function serveDateFor(friday: ISODate): ISODate | null {
  const s = fridayStatus(friday);
  if (s.kind === "school") return friday;
  if (s.kind === "moved") return s.serveOn;
  return null;
}

/** Upcoming Fridays a customer may order for: on the calendar and with a pizza day that week. */
export function orderableFridays(today: ISODate, weeks: number): ISODate[] {
  return selectableFridays(today, weeks).filter((f) => serveDateFor(f) !== null);
}

export function isOrderableFriday(iso: unknown, today: ISODate, weeks: number): iso is ISODate {
  return isISODate(iso) && isFriday(iso) && orderableFridays(today, weeks).includes(iso);
}

export type CalendarException = { friday: ISODate; status: FridayStatus };

/** Every Friday of the school year that is not a plain pizza Friday, plus Fridays with a note. */
export function fridayExceptions(): CalendarException[] {
  const out: CalendarException[] = [];
  let d: ISODate = SCHOOL_YEAR.firstDay;
  while (d <= SCHOOL_YEAR.lastDay) {
    if (isFriday(d)) {
      const status = fridayStatus(d);
      if (status.kind !== "school" || status.note) out.push({ friday: d, status });
    }
    d = addDays(d, 1);
  }
  return out;
}
