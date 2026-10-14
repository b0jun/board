import "server-only";
import { io } from "next/cache";
import { maybeFail } from "@/shared/lib/chaos";
import type {
  CreatePostValues,
  ListPostsParams,
  Post,
  PostListResponse,
} from "../types";
import { postRepository } from "./post-repository";

// better-sqlite3 is synchronous, so with Cache Components a read would finish
// during prerender and be frozen into the static output. io() keeps each read
// out of the prerender.

export async function listPosts({
  page,
  size,
  ...filters
}: ListPostsParams): Promise<PostListResponse> {
  await io();
  maybeFail();
  const totalCount = postRepository.count(filters);
  const rows = postRepository.findPage({ offset: (page - 1) * size, limit: size, ...filters });

  return {
    items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    page,
    size,
    totalCount,
    totalPages: Math.ceil(totalCount / size),
  };
}

export async function getPost(id: number): Promise<Post | null> {
  await io();
  maybeFail();
  const row = postRepository.findById(id);
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
}

export async function createPost(values: CreatePostValues): Promise<Post> {
  maybeFail();
  const row = postRepository.insert({ ...values, createdAt: new Date() });
  return { ...row, createdAt: row.createdAt.toISOString() };
}
