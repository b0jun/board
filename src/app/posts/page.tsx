import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Link from "next/link";
import { Suspense } from "react";
import { PostFilterBar } from "@/features/posts/components/post-filter-bar";
import { PostList } from "@/features/posts/components/post-list";
import { PostListSkeleton } from "@/features/posts/components/post-skeletons";
import { postQueries } from "@/features/posts/queries/post-queries";
import { DEFAULT_PAGE_SIZE, postListSearchSchema } from "@/features/posts/schemas/post-schema";
import { listPosts } from "@/features/posts/server/post-service";
import { getQueryClient } from "@/shared/query/get-query-client";

export default function PostsPage({ searchParams }: PageProps<"/posts">) {
  return (
    <main className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link
          href="/posts/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          글쓰기
        </Link>
      </div>
      {/* The filter bar has its own boundary (it reads the URL), separate from
          the list's: a loading list must never swap the input out. */}
      <Suspense fallback={<div className="h-[84px]" />}>
        <PostFilterBar />
      </Suspense>
      {/* searchParams is request data, so everything that reads it streams in. */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostListSection searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function PostListSection({ searchParams }: Pick<PageProps<"/posts">, "searchParams">) {
  const params = {
    ...postListSearchSchema.parse(await searchParams),
    size: DEFAULT_PAGE_SIZE,
  };

  // Same key as the client, but the server calls the service directly instead
  // of going through its own /api over HTTP. query() rejects on failure, so
  // the error reaches error.tsx.
  const queryClient = getQueryClient();
  await queryClient.query({
    ...postQueries.list(params),
    queryFn: () => listPosts(params),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList params={params} />
    </HydrationBoundary>
  );
}
