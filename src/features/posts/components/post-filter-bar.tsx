"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { postListHref } from "../lib/post-list-href";
import {
  MAX_KEYWORD_LENGTH,
  POST_CATEGORIES,
  POST_CATEGORY_LABELS,
  postCategorySchema,
} from "../schemas/post-schema";
import type { PostCategory } from "../types";

const KEYWORD_DEBOUNCE_MS = 300;

// The URL is the only owner of the filter state: this bar reads it and
// navigates, and the server renders the list for the new URL.
//
// Rendered OUTSIDE the list's <Suspense>, so the input keeps its focus and
// text while the list loads. Navigations are wrapped in a transition, so the
// previous list stays on screen instead of flashing back to the skeleton.
export function PostFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // The URL changes only when a navigation commits. The optimistic value makes
  // the chip switch at once, and a keyword typed mid-navigation is combined
  // with the category just chosen instead of the one still in the URL.
  const [category, setOptimisticCategory] = useOptimistic(
    postCategorySchema.safeParse(searchParams.get("category")).data,
  );

  const urlKeyword = searchParams.get("q") ?? "";
  const [keyword, setKeyword] = useState(urlKeyword);
  // Follow the URL when something else changes it (a "clear filters" link, the
  // header link, back/forward). While the user is typing, the URL only ever
  // trails the input by its own trimmed value, so that case is left alone.
  const [syncedUrlKeyword, setSyncedUrlKeyword] = useState(urlKeyword);
  if (urlKeyword !== syncedUrlKeyword) {
    setSyncedUrlKeyword(urlKeyword);
    if (urlKeyword !== keyword.trim()) {
      setKeyword(urlKeyword);
    }
  }

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A timer left running would navigate back here after the user has moved on.
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function selectCategory(next: PostCategory | undefined) {
    clearTimeout(debounceTimer.current);
    startTransition(() => {
      setOptimisticCategory(next);
      // Changing a filter always returns to the first page.
      router.push(postListHref({ category: next, q: keyword.trim() }));
    });
  }

  function changeKeyword(value: string) {
    setKeyword(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      startTransition(() => {
        // replace: one history entry per search, not one per keystroke.
        router.replace(postListHref({ category, q: value.trim() }));
      });
    }, KEYWORD_DEBOUNCE_MS);
  }

  const chipClass = (selected: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      selected
        ? "border-foreground bg-foreground text-background"
        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={!category}
          onClick={() => selectCategory(undefined)}
          className={chipClass(!category)}
        >
          전체
        </button>
        {POST_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => selectCategory(value)}
            className={chipClass(category === value)}
          >
            {POST_CATEGORY_LABELS[value]}
          </button>
        ))}
        {isPending && (
          <span role="status" className="text-sm text-zinc-500">
            불러오는 중…
          </span>
        )}
      </div>
      <input
        type="search"
        aria-label="제목 검색"
        placeholder="제목 검색"
        maxLength={MAX_KEYWORD_LENGTH}
        value={keyword}
        onChange={(event) => changeKeyword(event.target.value)}
        className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
      />
    </div>
  );
}
