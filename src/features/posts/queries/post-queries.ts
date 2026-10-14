import { queryOptions } from "@tanstack/react-query";
import { fetchPost, fetchPosts } from "../api/post-api";
import type { ListPostsParams } from "../types";

// The only place post query keys are written. Keys nest so a parent key
// invalidates everything below it:
//   ["posts"] > ["posts", "list"]   > ["posts", "list", { page, size }]
//             > ["posts", "detail"] > ["posts", "detail", id]
export const postQueries = {
  all: () => ["posts"] as const,

  lists: () => [...postQueries.all(), "list"] as const,
  list: (params: ListPostsParams) =>
    queryOptions({
      queryKey: [...postQueries.lists(), params] as const,
      queryFn: () => fetchPosts(params),
    }),

  details: () => [...postQueries.all(), "detail"] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...postQueries.details(), id] as const,
      queryFn: () => fetchPost(id),
    }),
};
