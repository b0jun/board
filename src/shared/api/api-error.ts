export type FieldErrors = Record<string, string[]>;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: FieldErrors;
  };
};

// An expected failure with a status the client should see. Throw it from a
// route handler or a service; withErrorHandling turns it into the response.
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: FieldErrors,
) {
  const body: ApiErrorBody = { error: { code, message, fieldErrors } };
  return Response.json(body, { status });
}
