"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/shared/lib/format-date";
import { postQueries } from "../queries/post-queries";
import { PostCategoryBadge } from "./post-category-badge";

export function PostDetail({ id }: { id: number }) {
  const { data: post } = useSuspenseQuery(postQueries.detail(id));

  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <PostCategoryBadge category={post.category} />
        </div>
        <h2 className="text-xl font-semibold break-words">{post.title}</h2>
        <p className="text-sm text-zinc-500">
          {post.nickname} · {formatDateTime(post.createdAt)}
        </p>
      </header>
      {/* Rendered as text: React escapes it, so HTML in a post is shown literally. */}
      <p className="break-words whitespace-pre-wrap">{post.content}</p>
    </article>
  );
}
