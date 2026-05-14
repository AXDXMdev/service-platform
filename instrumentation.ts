import type { Instrumentation } from "next"
import { logServerError, logServerInfo } from "./lib/serverLogger"

let started = false

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || started) {
    return
  }

  started = true
  logServerInfo("Next.js server instrumentation registered", {
    runtime: process.env.NEXT_RUNTIME,
    environment: process.env.NODE_ENV ?? "development",
  })
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const resolvedError = error instanceof Error ? error : new Error(String(error))

  logServerError("Unhandled Next.js request error", {
    request: {
      path: request.path,
      method: request.method,
      requestId: request.headers["x-vercel-id"] ?? request.headers["x-request-id"] ?? "unknown",
    },
    context: {
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
    error: {
      name: resolvedError.name,
      message: resolvedError.message,
      digest: "digest" in resolvedError ? resolvedError.digest : undefined,
    },
  })
}
