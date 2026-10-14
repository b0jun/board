import type { z } from "zod";
import type {
  createPostSchema,
  listPostsParamsSchema,
  postCategorySchema,
} from "./schemas/post-schema";

export type PostCategory = z.output<typeof postCategorySchema>;

export type PostSummary = {
  id: number;
  title: string;
  nickname: string;
  category: PostCategory;
  /** ISO 8601 */
  createdAt: string;
};

export type Post = PostSummary & {
  content: string;
};

export type PostListResponse = {
  items: PostSummary[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
};

/** What the form sends: nickname may be omitted. */
export type CreatePostInput = z.input<typeof createPostSchema>;
/** After validation: nickname is always set. */
export type CreatePostValues = z.output<typeof createPostSchema>;
export type ListPostsParams = z.output<typeof listPostsParamsSchema>;
/** The filter part of ListPostsParams: what narrows the list, not which page of it. */
export type PostListFilters = Pick<ListPostsParams, "q" | "category">;
