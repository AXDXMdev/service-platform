import { NextResponse } from "next/server"

type ApiErrorCode =
  | "bad_request"
  | "configuration_error"
  | "forbidden"
  | "method_not_allowed"
  | "not_found"
  | "rate_limited"
  | "unauthorized"
  | "unsupported_media_type"
  | "upstream_error"

export function apiOk<T>(
  data: T,
  init?: ResponseInit & { warnings?: string[] }
) {
  return NextResponse.json(
    {
      ok: true,
      data,
      warnings: init?.warnings ?? [],
    },
    init
  )
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  init?: ResponseInit
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    {
      ...init,
      status,
    }
  )
}
