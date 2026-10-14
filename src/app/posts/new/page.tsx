import Link from "next/link";
import { PostForm } from "@/features/posts/components/post-form";

export default function NewPostPage() {
  return (
    <main className="flex flex-col gap-4">
      <Link href="/posts" className="text-sm text-zinc-500 hover:underline">
        ← 목록으로
      </Link>
      <h2 className="text-xl font-semibold">글쓰기</h2>
      <PostForm />
    </main>
  );
}
