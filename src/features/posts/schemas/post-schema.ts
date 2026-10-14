import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
export const ANONYMOUS_NICKNAME = "익명";
export const MAX_KEYWORD_LENGTH = 50;

export const POST_CATEGORIES = ["free", "question", "info"] as const;
export const POST_CATEGORY_LABELS: Record<(typeof POST_CATEGORIES)[number], string> = {
  free: "자유",
  question: "질문",
  info: "정보",
};
export const DEFAULT_POST_CATEGORY = "free";

export const postCategorySchema = z.enum(POST_CATEGORIES);

// Title search keyword. Blank means "no keyword".
const keywordSchema = z
  .string()
  .trim()
  .max(MAX_KEYWORD_LENGTH)
  .transform((value) => value || undefined);

// Shared by the write form (client) and POST /api/posts (server).
export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(100, "제목은 100자 이하로 입력해 주세요."),
  content: z
    .string()
    .trim()
    .min(1, "본문을 입력해 주세요.")
    .max(5000, "본문은 5000자 이하로 입력해 주세요."),
  nickname: z
    .string()
    .trim()
    .max(20, "닉네임은 20자 이하로 입력해 주세요.")
    .optional()
    .transform((value) => value || ANONYMOUS_NICKNAME),
  category: postCategorySchema.default(DEFAULT_POST_CATEGORY),
});

export const listPostsParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  q: keywordSchema.optional(),
  category: postCategorySchema.optional(),
});

// Decimal digits only, so "0x1" or "1e0" do not alias post 1.
export const postIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,8}$/)
  .transform(Number);

// The list page's `?page=` value. Anything that is not a positive integer
// (missing, "abc", repeated params) falls back to the first page. A number too
// large for SQLite's offset is still "past the last page", so it is lowered to
// MAX_PAGE and the list shows its out-of-range notice.
const MAX_PAGE = 999_999_999;
export const pageParamSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform((value) => (value.length > 9 ? MAX_PAGE : Number(value)))
  .catch(1);

// The list page's whole query string. A URL is typed by people, so every
// field falls back instead of failing: bad page -> 1, bad filter -> no filter.
export const postListSearchSchema = z.object({
  page: pageParamSchema,
  q: keywordSchema.optional().catch(undefined),
  category: postCategorySchema.optional().catch(undefined),
});
