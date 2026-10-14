"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import type { FieldErrors } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { useCreatePost } from "../queries/use-create-post";
import {
  createPostSchema,
  DEFAULT_POST_CATEGORY,
  POST_CATEGORIES,
  POST_CATEGORY_LABELS,
} from "../schemas/post-schema";

export function PostForm() {
  const router = useRouter();
  const { mutate, isPending, isSuccess } = useCreatePost();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Same schema the API validates with, so most mistakes never leave the browser.
    const input = createPostSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!input.success) {
      setFieldErrors(z.flattenError(input.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    mutate(input.data, {
      onSuccess: (post) => router.push(`/posts/${post.id}`),
      // Only field errors are handled here; every other failure is toasted
      // by the MutationCache in get-query-client.
      onError: (error) => {
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
        }
      },
    });
  }

  return (
    // Inputs are uncontrolled, so a failed submit leaves what the user typed.
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">카테고리</legend>
        <div className="flex gap-4">
          {POST_CATEGORIES.map((value) => (
            <label key={value} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="category"
                value={value}
                defaultChecked={value === DEFAULT_POST_CATEGORY}
              />
              {POST_CATEGORY_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <TextField label="제목" name="title" maxLength={100} error={fieldErrors.title?.[0]} />
      <TextField
        label="닉네임 (선택)"
        name="nickname"
        maxLength={20}
        placeholder="비워 두면 익명"
        error={fieldErrors.nickname?.[0]}
      />
      <TextField
        label="본문"
        name="content"
        multiline
        maxLength={5000}
        error={fieldErrors.content?.[0]}
      />
      {/* Stays disabled after success until the detail page takes over. */}
      <Button type="submit" disabled={isPending || isSuccess} className="self-end">
        {isPending ? "등록 중…" : "등록"}
      </Button>
    </form>
  );
}
