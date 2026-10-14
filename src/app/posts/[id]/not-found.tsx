import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="py-16 text-center text-zinc-500">
      <p>게시글을 찾을 수 없습니다.</p>
      <Link href="/posts" className="mt-3 inline-block underline">
        목록으로
      </Link>
    </div>
  );
}
