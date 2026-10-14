import { postIdSchema } from "@/features/posts/schemas/post-schema";
import { getPost } from "@/features/posts/server/post-service";
import { AppError } from "@/shared/api/api-error";
import { withErrorHandling } from "@/shared/api/with-error-handling";

export const GET = withErrorHandling(
  async (_request, context: RouteContext<"/api/posts/[id]">) => {
    const id = postIdSchema.safeParse((await context.params).id);
    const post = id.success ? await getPost(id.data) : null;

    if (!post) {
      throw new AppError(404, "POST_NOT_FOUND", "게시글을 찾을 수 없습니다.");
    }

    return Response.json(post);
  },
);
