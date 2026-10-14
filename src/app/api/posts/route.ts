import { createPostSchema, listPostsParamsSchema } from "@/features/posts/schemas/post-schema";
import { createPost, listPosts } from "@/features/posts/server/post-service";
import { withErrorHandling } from "@/shared/api/with-error-handling";

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const params = listPostsParamsSchema.parse(Object.fromEntries(searchParams));

  return Response.json(await listPosts(params));
});

export const POST = withErrorHandling(async (request) => {
  // A body that is not JSON becomes null and fails validation like any other bad input.
  const body: unknown = await request.json().catch(() => null);
  const values = createPostSchema.parse(body);

  return Response.json(await createPost(values), { status: 201 });
});
