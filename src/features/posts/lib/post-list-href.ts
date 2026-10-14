import type { PostListFilters } from "../types";

// The list URL for a page and a set of filters. Defaults are left out, so the
// unfiltered first page is plain /posts.
export function postListHref({ page = 1, q, category }: { page?: number } & PostListFilters) {
  const search = new URLSearchParams();
  if (category) search.set("category", category);
  if (q) search.set("q", q);
  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `/posts?${query}` : "/posts";
}
