import { DEFAULT_PAGE_SIZE } from "../schemas/post-schema";

const barClass = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";

export function PostListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="게시글을 불러오는 중" className="flex flex-col gap-4 py-3">
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
        <li key={index} className="flex flex-col gap-2 px-2">
          <div className={`${barClass} h-5 w-2/3`} />
          <div className={`${barClass} h-4 w-1/3`} />
        </li>
      ))}
    </ul>
  );
}

export function PostDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="게시글을 불러오는 중" className="flex flex-col gap-4">
      <div className={`${barClass} h-7 w-1/2`} />
      <div className={`${barClass} h-4 w-1/4`} />
      <div className={`${barClass} h-32 w-full`} />
    </div>
  );
}
