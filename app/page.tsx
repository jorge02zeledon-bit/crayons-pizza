import Image from "next/image";
import Link from "next/link";
import { MenuSection } from "@/components/MenuSection";
import { OrderButton } from "@/components/OrderButton";
import { STORE, SLICE_PRICE_CENTS, SUBSCRIPTION_PRICE_CENTS } from "@/lib/menu";
import { formatMoney } from "@/lib/cart";
import { formatFriday } from "@/lib/fridays";
import { SCHOOL_YEAR, fridayExceptions } from "@/lib/schoolCalendar";

export default function HomePage() {
  const price = formatMoney(SLICE_PRICE_CENTS).replace(".00", "");
  const subPrice = formatMoney(SUBSCRIPTION_PRICE_CENTS).replace(".00", "");
  const exceptions = fridayExceptions();
  const firstFriday = "2026-08-14";
  return (
    <main>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-inner">
          <h1 id="hero-h" className="display">
            <span>Six</span>
            <span>dollar</span>
            <span>Fridays.</span>
          </h1>
          <p className="hero-sub">
            Cheese pizza for {price} a Friday, or {subPrice} a month for every Friday: one slice for preschool and VPK, two slices for K
            through 6th. Pick your Friday on the calendar and we hand deliver
            the slice to your student&apos;s classroom. Nothing to pick up.
          </p>
          <div className="hero-cta">
            <OrderButton />
            <a className="link-under" href="#how">How it works</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Image src="/images/cheese.svg" alt="" width={900} height={900} priority />
        </div>
      </section>

      <div className="band" role="presentation">
        <span>One Friday, {price}.</span>
        <span>Every Friday, {subPrice} a month.</span>
        <span>Delivered to the classroom.</span>
      </div>

      <MenuSection />

      <section className="pickup" id="how" aria-labelledby="how-h">
        <div className="wrap">
          <h2 id="how-h" className="h2">How it works</h2>
          <ol className="steps">
            <li>
              <strong>Choose one Friday or every Friday.</strong>
              <span>
                {price} a Friday is one slice for preschool and VPK, two slices for K through 6th. The subscription is {subPrice} every four
                Fridays and you can cancel any time.
              </span>
            </li>
            <li>
              <strong>Pick the Friday on the calendar.</strong>
              <span>
                For a subscription that is your first Friday. Up to {STORE.maxWeeksAhead} weeks ahead. No school on a Friday? We deliver the
                Thursday before. School break all week? No pizza day, and the calendar shows it.
              </span>
            </li>
            <li>
              <strong>Pay online. We bring the slice to the student.</strong>
              <span>
                Card, Apple Pay or Google Pay on a secure page. On Friday the slice is hand delivered to the grade and teacher or room you
                entered. No pickup, nothing for parents to do.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section className="calendar" id="calendar" aria-labelledby="cal-h">
        <div className="wrap">
          <h2 id="cal-h" className="h2">Pizza Fridays and the school calendar</h2>
          <p className="cal-rule">
            Every Friday from {formatFriday(firstFriday, "short")} to {formatFriday(SCHOOL_YEAR.lastDay, "short")} is a pizza Friday, except the
            ones below. When there is no school on a Friday, slices are delivered the Thursday before. When the whole week is a break, there is
            no pizza that week and you cannot pick that Friday. Dates follow the school&apos;s {SCHOOL_YEAR.label} calendar and move if the school moves them.
          </p>
          <table className="cal-table">
            <thead>
              <tr>
                <th scope="col">Friday</th>
                <th scope="col">At school</th>
                <th scope="col">Pizza</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(({ friday, status }) => (
                <tr key={friday} className={status.kind === "skipped" ? "row-skip" : status.kind === "moved" ? "row-moved" : ""}>
                  <td>{formatFriday(friday, "short")}, {friday.slice(0, 4)}</td>
                  <td>{status.kind === "school" ? status.note : status.kind === "summer" ? "School is out" : status.reason}</td>
                  <td>
                    {status.kind === "moved" ? (
                      <strong>Thursday, {formatFriday(status.serveOn, "short").replace(/^\w{3}, /, "")} instead</strong>
                    ) : status.kind === "skipped" || status.kind === "summer" ? (
                      <span className="muted">No pizza this week</span>
                    ) : (
                      "Pizza Friday as usual"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hours" id="hours" aria-labelledby="hours-h">
        <div className="wrap hours-grid">
          <div className="hours-col">
            <h2 id="hours-h" className="h3 hours-title">Find us</h2>
            <address>
              <strong>{STORE.name}</strong>
              <br />
              {STORE.address}
              <br />
              {STORE.city}
              <br />
              <a className="plain" href={`tel:${STORE.phone.replace(/\D/g, "")}`}>{STORE.phone}</a>
            </address>
          </div>
          <div className="hours-col">
            <h2 className="h3 hours-title">Hours</h2>
            <table className="hours-table">
              <tbody>
                {STORE.hours.map((h) => (
                  <tr key={h.days}>
                    <th scope="row">{h.days}</th>
                    <td>
                      {h.open} to {h.close}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hours-note">
              Online orders are not picked up here. {STORE.delivery}
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="wordmark">Crayons Pizza</span>
          <Link className="staff-link" href="/admin/orders" aria-label="Staff orders" title="Staff">
            <Image src="/images/cheese.svg" alt="" width={22} height={22} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
