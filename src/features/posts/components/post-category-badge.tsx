import { POST_CATEGORY_LABELS } from "../schemas/post-schema";
import type { PostCategory } from "../types";

export function PostCategoryBadge({ category }: { category: PostCategory }) {
  return (
    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {POST_CATEGORY_LABELS[category]}
    </span>
  );
}
