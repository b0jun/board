import Link from "next/link";

export default function PostsLayout({ children }: LayoutProps<"/posts">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">
        <Link href="/posts">익명 게시판</Link>
      </h1>
      {children}
    </div>
  );
}
