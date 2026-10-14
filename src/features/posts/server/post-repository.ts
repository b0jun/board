import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/shared/db/client";
import { posts } from "@/shared/db/schema";
import type { PostListFilters } from "../types";

type NewPostRow = typeof posts.$inferInsert;

// Both filters are optional; and() drops the undefined ones.
function matches({ q, category }: PostListFilters) {
  return and(
    category ? eq(posts.category, category) : undefined,
    // instr, not LIKE: "%" and "_" in the keyword stay literal.
    q ? sql`instr(lower(${posts.title}), lower(${q})) > 0` : undefined,
  );
}

// SQL only. Business rules live in post-service.
export const postRepository = {
  findPage({ offset, limit, ...filters }: { offset: number; limit: number } & PostListFilters) {
    return getDb()
      .select({
        id: posts.id,
        title: posts.title,
        nickname: posts.nickname,
        category: posts.category,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(matches(filters))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit)
      .offset(offset)
      .all();
  },

  count(filters: PostListFilters) {
    return getDb().select({ value: count() }).from(posts).where(matches(filters)).get()?.value ?? 0;
  },

  findById(id: number) {
    return getDb().select().from(posts).where(eq(posts.id, id)).get();
  },

  insert(values: NewPostRow) {
    return getDb().insert(posts).values(values).returning().get();
  },
};
