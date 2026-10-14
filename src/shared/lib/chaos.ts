import "server-only";
import { AppError } from "@/shared/api/api-error";

// Demo only. Fails a share of service calls so the retry paths (error screen,
// automatic query retry, toast) can be exercised on purpose.
//   CHAOS_FAILURE_RATE=0.5  -> about half of the calls fail
//   unset or 0              -> off
const failureRate = Number(process.env.CHAOS_FAILURE_RATE) || 0;

export function maybeFail() {
  if (Math.random() < failureRate) {
    throw new AppError(
      503,
      "TEMPORARY_FAILURE",
      "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
    );
  }
}
