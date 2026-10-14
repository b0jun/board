"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";

export default function PostsError({ retry }: { error: Error; retry: () => void }) {
  const { reset: resetQueryErrors } = useQueryErrorResetBoundary();

  function handleRetry() {
    // A query that failed in the browser stays cached as an error, and
    // useSuspenseQuery would rethrow it without refetching. Clear that first,
    // then let Next re-render the segment on the server.
    resetQueryErrors();
    retry();
  }

  return (
    <div role="alert" className="py-16 text-center">
      <p className="text-zinc-500">게시글을 불러오지 못했습니다.</p>
      <button type="button" onClick={handleRetry} className="mt-3 underline">
        다시 시도
      </button>
    </div>
  );
}
