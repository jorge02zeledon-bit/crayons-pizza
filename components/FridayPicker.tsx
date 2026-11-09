"use client";

import { useMemo, useState } from "react";
import { addDays, formatFriday, isFriday, todayInZone, type ISODate, selectableFridays } from "@/lib/fridays";
import { fridayStatus, orderableFridays } from "@/lib/schoolCalendar";
import { STORE } from "@/lib/menu";

type Props = {
  value: ISODate | "";
  onChange: (date: ISODate) => void;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shortDay = (iso: ISODate) => formatFriday(iso, "short").replace(/^\w{3}, /, "");

/** A month calendar where only upcoming pizza Fridays can be chosen. */
export function FridayPicker({ value, onChange, id = "friday-picker", describedBy, invalid }: Props) {
  const today = useMemo(() => todayInZone(STORE.timeZone), []);
  const onCalendar = useMemo(() => selectableFridays(today, STORE.maxWeeksAhead), [today]);
  const orderable = useMemo(() => new Set(orderableFridays(today, STORE.maxWeeksAhead)), [today]);
  const first = onCalendar[0];
  const last = onCalendar[onCalendar.length - 1];
  const [view, setView] = useState(() => (value || first).slice(0, 7)); // YYYY-MM

  const [y, m] = view.split("-").map(Number);
  const monthStart = `${view}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leading = new Date(`${monthStart}T00:00:00Z`).getUTCDay();
  const cells: (ISODate | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i)),
  ];
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(`${monthStart}T00:00:00Z`),
  );
  const canPrev = view > first.slice(0, 7);
  const canNext = view < last.slice(0, 7);
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setView(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };

  const visibleStatuses = cells.filter((d): d is ISODate => !!d && onCalendar.includes(d)).map((d) => fridayStatus(d));
  const hasSkipped = visibleStatuses.some((s) => s.kind === "skipped");
  const hasMoved = visibleStatuses.some((s) => s.kind === "moved");
  const selected = value ? fridayStatus(value) : null;

  return (
    <div className={`cal ${invalid ? "invalid" : ""}`} id={id} role="group" aria-label="Choose a Friday" aria-describedby={describedBy}>
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="cal-month" aria-live="polite">{monthLabel}</span>
        <button type="button" className="cal-nav" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className={`cal-wd ${w === "Fri" ? "cal-wd-fri" : ""}`} role="columnheader" aria-label={w}>
            {w[0]}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="cal-empty" />;
          if (!onCalendar.includes(d)) {
            return (
              <span key={d} className={`cal-day ${isFriday(d) ? "cal-past-friday" : ""}`} aria-hidden="true">
                {Number(d.slice(8))}
              </span>
            );
          }
          const status = fridayStatus(d);
          if (!orderable.has(d)) {
            const why = status.kind === "skipped" ? status.reason : "school is out";
            return (
              <button
                key={d}
                type="button"
                className="cal-day cal-skipped"
                disabled
                aria-label={`${formatFriday(d)}, no pizza: ${why}`}
                title={`No pizza: ${why}`}
              >
                {Number(d.slice(8))}
              </button>
            );
          }
          const moved = status.kind === "moved";
          return (
            <button
              key={d}
              type="button"
              className={`cal-day cal-friday ${moved ? "cal-moved" : ""} ${value === d ? "selected" : ""}`}
              aria-pressed={value === d}
              aria-label={moved ? `${formatFriday(d)}, no school, slices served ${formatFriday(status.serveOn)}` : formatFriday(d)}
              title={moved ? `No school this Friday. Delivered Thursday, ${shortDay(status.serveOn)}.` : undefined}
              onClick={() => onChange(d)}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="cal-foot">
        {selected && selected.kind === "moved"
          ? `${formatFriday(value as ISODate)}: no school. Delivered Thursday, ${shortDay(selected.serveOn)}${selected.note ? ` (${selected.note.toLowerCase()})` : ""}.`
          : value
            ? formatFriday(value)
            : "Fridays only. Tap one."}
      </p>
      {hasSkipped || hasMoved ? (
        <p className="cal-legend">
          {hasSkipped ? <span className="cal-legend-skipped">Crossed out: school break, no pizza that week.</span> : null}
          {hasMoved ? <span className="cal-legend-moved">Thu: no school Friday, slices delivered Thursday.</span> : null}
        </p>
      ) : null}
    </div>
  );
}
