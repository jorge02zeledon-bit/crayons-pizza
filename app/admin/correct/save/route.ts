import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin";
import { GRADES } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

/** POST /admin/correct/save (form): saves a staff correction to the order at the payment provider. */
export async function POST(request: Request) {
  const jar = await cookies();
  if (!verifySession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/admin/orders", request.url), 303);
  }
  const form = await request.formData();
  const session = String(form.get("session") ?? "");
  const student = String(form.get("student") ?? "").trim().slice(0, 80);
  const grade = String(form.get("grade") ?? "").trim();
  const classroom = String(form.get("classroom") ?? "").trim().slice(0, 60);
  const back = new URL("/admin/correct", request.url);
  back.searchParams.set("session", session);

  const bad = !session ? "session" : student.length < 2 ? "student" : !(GRADES as readonly string[]).includes(grade) ? "grade" : classroom.length < 1 ? "classroom" : null;
  if (bad) {
    back.searchParams.set("error", bad);
    return NextResponse.redirect(back, 303);
  }
  try {
    await getPaymentProvider().correctOrder(session, { student, grade, classroom });
  } catch (err) {
    console.error("correction failed", err);
    back.searchParams.set("error", "save");
    return NextResponse.redirect(back, 303);
  }
  const done = new URL("/admin/orders", request.url);
  done.searchParams.set("saved", session.slice(-6).toUpperCase());
  return NextResponse.redirect(done, 303);
}
