"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export type Bookmark = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  created_at: string;
};

export async function getBookmarks(): Promise<Bookmark[]> {
  const db = sql();
  const rows = await db`
    SELECT id, title, url, description, created_at
    FROM bookmarks
    ORDER BY created_at DESC
  `;
  return rows as Bookmark[];
}

export async function addBookmark(formData: FormData) {
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const description = formData.get("description") as string;

  if (!title?.trim() || !url?.trim()) return;

  const db = sql();
  await db`
    INSERT INTO bookmarks (title, url, description)
    VALUES (${title.trim()}, ${url.trim()}, ${description?.trim() || null})
  `;

  revalidatePath("/");
}

export async function deleteBookmark(id: number) {
  const db = sql();
  await db`DELETE FROM bookmarks WHERE id = ${id}`;
  revalidatePath("/");
}
