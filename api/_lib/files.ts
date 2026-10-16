import { randomUUID } from "node:crypto";
import { BUCKET, db, HttpError } from "./env.js";
import type { ChatFile } from "../../src/lib/inquiry-shared.js";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/** A one-time URL the browser uploads one file to, straight into storage. */
export async function uploadUrl(folder: string, name: string, type: string) {
  const ext = TYPES[type];
  if (!ext) throw new HttpError(415, "file-type");
  const safe = name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 40) || "file";
  const path = `${folder}/${randomUUID().slice(0, 8)}-${safe}.${ext}`;
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new HttpError(500, "upload-url");
  return { path, url: data.signedUrl, token: data.token };
}

/** Short-lived links for showing files. */
export async function signed(paths: string[], seconds = 3600): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { data } = await db().storage.from(BUCKET).createSignedUrls(paths, seconds);
  for (const row of data ?? []) if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  return out;
}

export const fileName = (path: string) => path.split("/").pop()?.replace(/^[a-f0-9]{8}-/, "") ?? path;

export async function withUrls(paths: string[]): Promise<ChatFile[]> {
  const urls = await signed(paths);
  return paths.map((path) => ({ path, name: fileName(path), url: urls.get(path) }));
}

/** Moves draft uploads under the inquiry's folder, so they belong to it. */
export async function adopt(paths: string[], inquiryId: string): Promise<string[]> {
  const out: string[] = [];
  for (const path of paths) {
    if (!path.startsWith("drafts/")) {
      out.push(path);
      continue;
    }
    const next = `${inquiryId}/${path.split("/").pop()}`;
    const { error } = await db().storage.from(BUCKET).move(path, next);
    out.push(error ? path : next);
  }
  return out;
}
