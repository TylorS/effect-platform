import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"

import * as Duration from "@effect/data/Duration"
import * as FileSystem from "@effect/platform/FileSystem"
import type * as App from "@effect/platform/Http/App"
import * as Headers from "@effect/platform/Http/Headers"
import type { Method } from "@effect/platform/Http/Method"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as StaticFileError from "@effect/platform/internal/http/staticFiles/error"
import { StaticFiles } from "@effect/platform/internal/http/staticFiles/service"

export interface StaticFileServerOptions {
  readonly maxAge?: Duration.DurationInput
  readonly immutable?: boolean
}

export const staticFileServer = (
  options?: StaticFileServerOptions
): App.Default<FileSystem.FileSystem | StaticFiles, StaticFileError.StaticFileError> => {
  return Effect.gen(function*(_) {
    const request = yield* _(ServerRequest.ServerRequest)

    // Only handle GET and HEAD requests
    if (!(isSupportedMethod(request.method))) {
      return yield* _(Effect.fail(StaticFileError.MethodNotSupported({ request, methods: supportedMethods })))
    }

    const { staticFiles } = yield* _(StaticFiles)
    const { compressions, contentType, etag, filePath } = yield* _(
      staticFiles.get(request.url),
      Effect.mapError(() => StaticFileError.FileNotFound({ request }))
    )
    const headers = baseHeaders(contentType, etag, options)

    // If HEAD request, return empty response with our headers
    if (request.method === "HEAD") {
      return ServerResponse.empty({
        headers
      })
    }

    // Otherwise, return the file as a stream
    // Attempt to find a file compression that matches the request's accept-encoding header
    for (const encoding of parseRequestAcceptEncoding(request)) {
      // If we have a compressed version of the file, return it
      if (encoding in compressions) {
        return yield* _(fileStreamResponse(
          compressions[encoding],
          contentType,
          addCompressionHeaders(headers, encoding)
        ))
      }
    }

    // Otherwise, return the file stream
    return yield* _(fileStreamResponse(
      filePath,
      contentType,
      headers
    ))
  })
}

const supportedMethods = ["GET", "HEAD"] as const
const isSupportedMethod = (method: Method): method is typeof supportedMethods[number] =>
  supportedMethods.includes(method as any)

const baseHeaders = (
  contentType: string,
  etag: Option.Option<string>,
  options?: StaticFileServerOptions
): Headers.Headers => {
  const headers: Record<string, string> = { "content-type": contentType }

  if (Option.isSome(etag)) {
    headers.etag = etag.value
  }

  if (options) {
    const directives: Array<string> = []

    if (options.maxAge !== undefined) {
      directives.push(`max-age=${Duration.toMillis(options.maxAge) / 1000}`)
    }

    if (options.immutable) {
      directives.push("immutable")
    }

    if (directives.length > 0) {
      headers["cache-control"] = directives.join(", ")
    }
  }

  return headers
}

const addCompressionHeaders = (headers: Headers.Headers, encoding: string): Headers.Headers => ({
  ...headers,
  "content-encoding": encoding,
  // Set the vary header for proxy caches
  vary: "accept-encoding"
})

function fileStreamResponse(path: string, contentType: string, headers: Headers.Headers) {
  return FileSystem.FileSystem.pipe(
    Effect.map((fs) => ServerResponse.stream(fs.stream(path), { contentType, headers }))
  )
}

function parseRequestAcceptEncoding(request: ServerRequest.ServerRequest): Array<string> {
  return Headers.get(request.headers, "accept-encoding").pipe(
    Option.map((header) => parseAcceptEncodingHeader(header)),
    Option.getOrElse(() => [])
  )
}

function parseAcceptEncodingHeader(header: string): Array<string> {
  if (header) {
    const encodings = header.split(",").map(parseAcceptEncoding)

    // Sort the encodings based on weight (higher weight comes first)
    encodings.sort((a, b) => b.weight - a.weight)

    return encodings.map((encoding) => encoding.name)
  } else {
    return []
  }
}

function parseAcceptEncoding(item: string) {
  const parts = item.trim().split(";")

  const name = parts[0].trim()
  const weight = parts[1] ? parseFloat(parts[1].trim().split("=")[1]) : 1

  return { name, weight }
}
