import { db, HttpError } from "./env.js";
import { withUrls } from "./files.js";
import type { Availability, Booking, ChatMessage } from "../../src/lib/inquiry-shared.js";

export async function messagesOf(inquiryId: string): Promise<ChatMessage[]> {
  const { data } = await db()
    .from("inquiry_messages")
    .select("id, sender, body, files, created_at")
    .eq("inquiry_id", inquiryId)
    .order("id", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as (Omit<ChatMessage, "files"> & { files: string[] })[];
  const files = await withUrls(rows.flatMap((r) => r.files ?? []));
  const byPath = new Map(files.map((f) => [f.path, f]));
  return rows.map((r) => ({ ...r, files: (r.files ?? []).map((p) => byPath.get(p) ?? { path: p, name: p }) }));
}

export async function bookingsOf(inquiryId: string): Promise<Booking[]> {
  const { data } = await db()
    .from("bookings")
    .select("id, starts_at, minutes, status, meet_url")
    .eq("inquiry_id", inquiryId)
    .order("starts_at", { ascending: true });
  return (data ?? []) as Booking[];
}

export async function availability(): Promise<Availability> {
  const { data } = await db().from("studio_settings").select("availability").eq("id", 1).maybeSingle();
  return data?.availability as Availability;
}

export async function postMessage(inquiryId: string, sender: ChatMessage["sender"], text: string, files: string[] = []) {
  const { error } = await db().from("inquiry_messages").insert({ inquiry_id: inquiryId, sender, body: text, files });
  if (error) throw new HttpError(500, "message");
  await db().from("inquiries").update({ last_message_at: new Date().toISOString() }).eq("id", inquiryId);
}

export const when = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("bg-BG", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

