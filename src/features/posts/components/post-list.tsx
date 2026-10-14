"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDateTime } from "@/shared/lib/format-date";
import { Pagination } from "@/shared/ui/pagination";
import { postListHref } from "../lib/post-list-href";
import { postQueries } from "../queries/post-queries";
import type { ListPostsParams } from "../types";
import { PostCategoryBadge } from "./post-category-badge";

export function PostList({ params }: { params: ListPostsParams }) {
  const { data } = useSuspenseQuery(postQueries.list(params));
  const { q, category } = params;
  const isFiltered = Boolean(q || category);

  if (data.totalCount === 0) {
    return (
      <div className="py-16 text-center text-zinc-500">
        {isFiltered ? (
          <>
            <p>조건에 맞는 게시글이 없습니다.</p>
            <Link href="/posts" className="mt-3 inline-block underline">
              필터 지우기
            </Link>
          </>
        ) : (
          <>
            <p>아직 게시글이 없습니다.</p>
            <Link href="/posts/new" className="mt-3 inline-block underline">
              첫 글 쓰기
            </Link>
          </>
        )}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500">
        <p>이 페이지에는 게시글이 없습니다.</p>
        <Link href={postListHref({ q, category })} className="mt-3 inline-block underline">
          1페이지로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {data.items.map((post) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}`}
              className="flex flex-col gap-1 px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="flex items-center gap-2">
                <PostCategoryBadge category={post.category} />
                <span className="truncate font-medium">{post.title}</span>
              </span>
              <span className="text-sm text-zinc-500">
                {post.nickname} · {formatDateTime(post.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        // Page links keep the current filters.
        hrefFor={(page) => postListHref({ page, q, category })}
      />
    </div>
  );
}
