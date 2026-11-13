import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin";
import { GRADES, isElementary, slicesPerServing } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";

export const metadata: Metadata = { title: "Fix an order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { session?: string; error?: string };

/** Staff form to correct the student, grade or room on a paid order. */
export default async function CorrectOrderPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const jar = await cookies();
  if (!verifySession(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <main className="page narrow admin">
        <p className="kicker">Staff only</p>
        <h1 className="h2">Sign in first</h1>
        <a className="btn btn-primary" href="/admin/orders">Go to orders</a>
      </main>
    );
  }
  const order = sp.session ? await getPaymentProvider().getOrder(sp.session) : null;
  if (!order) {
    return (
      <main className="page narrow admin">
        <p className="kicker">Staff only</p>
        <h1 className="h2">Order not found</h1>
        <a className="btn btn-ghost" href="/admin/orders">Back to orders</a>
      </main>
    );
  }
  const ref = order.sessionId.slice(-6).toUpperCase();
  const servings = order.lines.reduce((n, l) => n + l.qty, 0);
  const c = order.customer;
  const slices = servings * slicesPerServing(c.grade);
  return (
    <main className="page narrow admin">
      <p className="kicker">Staff only</p>
      <h1 className="h2">Fix order {ref}</h1>
      <p>
        {servings} serving{servings === 1 ? "" : "s"}, paid by {c.name || "unknown"}
        {c.phone ? `, ${c.phone}` : ""}. Right now it is for <strong>{c.student || "?"}</strong>, {c.grade || "no grade"},{" "}
        {c.classroom || "no room"}: {slices} slice{slices === 1 ? "" : "s"}.
      </p>
      <form className="form" method="post" action="/admin/correct/save">
        <input type="hidden" name="session" value={sp.session} />
        <div className={`field ${sp.error === "student" ? "invalid" : ""}`}>
          <label htmlFor="f-student">Student&apos;s name</label>
          <input id="f-student" name="student" type="text" maxLength={80} required defaultValue={c.student ?? ""} />
          {sp.error === "student" ? <p className="err" role="alert">Enter the student&apos;s name.</p> : null}
        </div>
        <div className="two-up">
          <div className={`field ${sp.error === "grade" ? "invalid" : ""}`}>
            <label htmlFor="f-grade">Grade</label>
            <select id="f-grade" name="grade" required defaultValue={c.grade ?? ""}>
              <option value="">Choose</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                  {isElementary(g) ? " (2 slices)" : " (1 slice)"}
                </option>
              ))}
            </select>
            {sp.error === "grade" ? <p className="err" role="alert">Choose a grade.</p> : null}
          </div>
          <div className={`field ${sp.error === "classroom" ? "invalid" : ""}`}>
            <label htmlFor="f-classroom">Teacher or room</label>
            <input id="f-classroom" name="classroom" type="text" maxLength={60} required defaultValue={c.classroom ?? ""} />
            {sp.error === "classroom" ? <p className="err" role="alert">Enter the teacher or room.</p> : null}
          </div>
        </div>
        {sp.error === "save" ? <p className="err" role="alert">The change could not be saved. Try again, or fix it in the Stripe dashboard.</p> : null}
        <p className="hint">Saves to the order itself, so the orders list, the CSV and any future Fridays of a subscription all follow.</p>
        <div className="row">
          <button type="submit" className="btn btn-primary">Save correction</button>
          <a className="btn btn-ghost" href="/admin/orders">Cancel</a>
        </div>
      </form>
    </main>
  );
}
