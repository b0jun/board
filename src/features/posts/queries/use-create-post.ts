import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../api/post-api";
import { postQueries } from "./post-queries";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postQueries.lists() }),
  });
}
