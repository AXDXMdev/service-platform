type LogContext = Record<string, unknown>

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry))
  }
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (/authorization|cookie|password|secret|token|key/i.test(key)) {
        return [key, "[redacted]"]
      }
      return [key, redact(entry)]
    })
  )
}

function emit(level: "info" | "warn" | "error", message: string, context: LogContext = {}) {
  if (process.env.NODE_ENV === "test" && level === "info") {
    return
  }

  const safeContext = redact(context) as LogContext
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...safeContext,
  }

  const line = JSON.stringify(payload)
  if (level === "error") {
    console.error(line)
    return
  }
  if (level === "warn") {
    console.warn(line)
    return
  }
  console.log(line)
}

export function createRequestLogContext(
  request: Request,
  context: LogContext = {}
) {
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    requestId:
      request.headers.get("x-vercel-id") ??
      request.headers.get("x-request-id") ??
      "unknown",
    ...context,
  }
}

export function logServerInfo(message: string, context: LogContext = {}) {
  emit("info", message, context)
}

export function logServerError(message: string, context: LogContext = {}) {
  emit("error", message, context)
}

export function logServerWarn(message: string, context: LogContext = {}) {
  emit("warn", message, context)
}
