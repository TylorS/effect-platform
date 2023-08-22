import * as Effect from "@effect/io/Effect"
import type { FileSystem } from "@effect/platform/FileSystem"
import type * as App from "@effect/platform/Http/App"
import * as Middleware from "@effect/platform/Http/Middleware"
import { staticFileServer, type StaticFileServerOptions } from "@effect/platform/internal/http/staticFiles/server"
import type { StaticFiles } from "@effect/platform/internal/http/staticFiles/service"

export const staticFileMiddleware = (
  options: StaticFileServerOptions
): <R, E>(app: App.Default<R, E>) => App.Default<R | FileSystem | StaticFiles, E> =>
  Middleware.make((app) => Effect.catchAll(staticFileServer(options), () => app))
