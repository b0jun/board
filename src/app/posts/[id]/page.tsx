import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetail } from "@/features/posts/components/post-detail";
import { PostDetailSkeleton } from "@/features/posts/components/post-skeletons";
import { postQueries } from "@/features/posts/queries/post-queries";
import { postIdSchema } from "@/features/posts/schemas/post-schema";
import { getPost } from "@/features/posts/server/post-service";
import { getQueryClient } from "@/shared/query/get-query-client";

export default function PostDetailPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <main className="flex flex-col gap-4">
      <Link href="/posts" className="text-sm text-zinc-500 hover:underline">
        ← 목록으로
      </Link>
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailSection params={params} />
      </Suspense>
    </main>
  );
}

async function PostDetailSection({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const id = postIdSchema.safeParse((await params).id);
  const post = id.success ? await getPost(id.data) : null;

  if (!post) {
    notFound();
  }

  // The post is already loaded for the 404 check; seed the client cache with
  // it under the factory key instead of fetching it a second time.
  const queryClient = getQueryClient();
  queryClient.setQueryData(postQueries.detail(post.id).queryKey, post);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetail id={post.id} />
    </HydrationBoundary>
  );
}
