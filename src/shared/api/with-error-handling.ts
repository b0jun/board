import { unstable_rethrow } from "next/navigation";
import { z, ZodError } from "zod";
import { AppError, errorResponse } from "./api-error";

type RouteHandler<Context> = (request: Request, context: Context) => Promise<Response>;

// Wraps a Route Handler so every failure leaves in the same JSON shape:
//   AppError  -> its own status and code
//   ZodError  -> 400 VALIDATION_ERROR with fieldErrors (from schema.parse)
//   otherwise -> logged, 500 INTERNAL_ERROR with no internal detail
export function withErrorHandling<Context>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Next.js signals (prerender bailout, redirect, notFound) are not failures.
      unstable_rethrow(error);

      if (error instanceof AppError) {
        return errorResponse(error.status, error.code, error.message, error.fieldErrors);
      }
      if (error instanceof ZodError) {
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "입력값을 확인해 주세요.",
          z.flattenError(error).fieldErrors,
        );
      }

      console.error(error);
      return errorResponse(500, "INTERNAL_ERROR", "서버에서 문제가 발생했습니다.");
    }
  };
}
