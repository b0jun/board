import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  nickname: text("nickname").notNull(),
  category: text("category", { enum: ["free", "question", "info"] }).notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
