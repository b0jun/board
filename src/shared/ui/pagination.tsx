import Link from "next/link";

const WINDOW_SIZE = 5;

type PaginationProps = {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Up to WINDOW_SIZE page numbers, centered on the current page.
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW_SIZE / 2), totalPages - WINDOW_SIZE + 1));
  const end = Math.min(totalPages, start + WINDOW_SIZE - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const itemClass = "rounded px-3 py-1.5 text-sm";
  const linkClass = `${itemClass} hover:bg-zinc-100 dark:hover:bg-zinc-800`;
  const disabledClass = `${itemClass} text-zinc-400`;

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          이전
        </Link>
      ) : (
        <span className={disabledClass}>이전</span>
      )}
      {pages.map((number) =>
        number === page ? (
          <span
            key={number}
            aria-current="page"
            className={`${itemClass} bg-foreground font-medium text-background`}
          >
            {number}
          </span>
        ) : (
          <Link key={number} href={hrefFor(number)} className={linkClass}>
            {number}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          다음
        </Link>
      ) : (
        <span className={disabledClass}>다음</span>
      )}
    </nav>
  );
}
