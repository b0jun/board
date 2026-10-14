import { connect } from "../src/shared/db/connect";
import { posts } from "../src/shared/db/schema";

const SEED_COUNT = 35;
const MINUTE = 60_000;

const db = connect();

// Re-running must not push the row count past SEED_COUNT.
if (db.select({ id: posts.id }).from(posts).limit(1).get()) {
  console.info("posts already has rows; skipping seed.");
  process.exit(0);
}

const now = Date.now();

// Oldest first, one minute apart, so "newest first" ordering is visible.
const rows = Array.from({ length: SEED_COUNT }, (_, index) => ({
  title: `샘플 게시글 ${index + 1}`,
  content: `${index + 1}번째 샘플 게시글입니다.\n페이지네이션 확인용 데이터입니다.`,
  nickname: index % 3 === 0 ? "익명" : `user${(index % 5) + 1}`,
  category: posts.category.enumValues[index % posts.category.enumValues.length],
  createdAt: new Date(now - (SEED_COUNT - index) * MINUTE),
}));

db.insert(posts).values(rows).run();
console.info(`Seeded ${rows.length} posts.`);
