import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HttpError } from "@/shared/api/http-client";

// Every hook's `error` is typed as HttpError: http-client throws nothing else.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: HttpError;
  }
}

// 4xx means the request itself is wrong; sending it again cannot succeed.
function isRetryable(error: Error) {
  return !(error instanceof HttpError && error.status >= 400 && error.status < 500);
}

function makeQueryClient() {
  return new QueryClient({
    // Global error handling. Components handle only what is specific to them:
    // field errors in a form, the error boundary for a screen with no data.
    queryCache: new QueryCache({
      onError: (error, query) => {
        // With no data the error boundary (error.tsx) already shows the
        // failure. A toast is for a background refetch failing while the
        // previous data stays on screen.
        if (query.state.data !== undefined) {
          toast.error(error.message);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Field errors are shown next to the inputs by the form itself.
        if (error instanceof HttpError && Object.keys(error.fieldErrors ?? {}).length > 0) {
          return;
        }
        toast.error(error.message);
      },
    }),
    defaultOptions: {
      queries: {
        // Server-prefetched data would otherwise refetch right after hydration.
        staleTime: 30 * 1000,
        // No retries on the server: a failed render should fail fast.
        retry: (failureCount, error) => !isServer && isRetryable(error) && failureCount < 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// Server: a new client per call so requests never share a cache.
// Browser: one client for the lifetime of the tab.
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
