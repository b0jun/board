import { http } from "@/shared/api/http-client";
import type { CreatePostInput, ListPostsParams, Post, PostListResponse } from "../types";

// Browser-side calls to the Route Handlers under /api/posts.

export function fetchPosts({ page, size, q, category }: ListPostsParams) {
  const search = new URLSearchParams({ page: String(page), size: String(size) });
  if (q) search.set("q", q);
  if (category) search.set("category", category);

  return http.get<PostListResponse>(`/api/posts?${search}`);
}

export function fetchPost(id: number) {
  return http.get<Post>(`/api/posts/${id}`);
}

export function createPost(input: CreatePostInput) {
  return http.post<Post>("/api/posts", input);
}
