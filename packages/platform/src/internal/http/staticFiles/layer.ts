import * as Duration from "@effect/data/Duration"
import * as Cache from "@effect/io/Cache"
import type { NoSuchElementException } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import type * as FileSystem from "@effect/platform/FileSystem"
import type { StaticFile } from "@effect/platform/internal/http/staticFiles/service"
import { StaticFiles, TypeId } from "@effect/platform/internal/http/staticFiles/service"

export interface StaticFilesLayerOptions {
  // File system options
  readonly directory: string
  readonly include?: ReadonlyArray<string>
  readonly exclude?: ReadonlyArray<string>
  readonly extensions?: ReadonlyArray<string> // Defaults to ['.html']
  readonly compressions?: {
    // Map of name as found in Accept-Encoding header to file extension
    // that we expect to find in the directory
    readonly [AcceptEncoding: string]: string // FileExtension
  }
  readonly etag?: boolean

  // Cache options
  readonly capacity?: number
  readonly timeToLive?: Duration.DurationInput
}

// TODO: Provide a directory to serve from
// TODO: Include/Exclude
// TODO: Extensions
// TODO: Compression algorithms
// TODO: Compute etags
// TODO: Preseed the cache

export function staticFilesLayer(
  options: StaticFilesLayerOptions
): Layer.Layer<FileSystem.FileSystem, never, StaticFiles> {
  return Layer.effect(
    StaticFiles,
    Effect.gen(function*(_) {
      const staticFiles = yield* _(
        Cache.make<string, never, NoSuchElementException, StaticFile>({
          capacity: options.capacity ?? 10_000,
          timeToLive: options.timeToLive ?? Duration.days(365),
          lookup: lookup(options)
        })
      )

      return StaticFiles.of({ [TypeId]: TypeId, staticFiles })
    })
  )
}

function lookup(options: StaticFilesLayerOptions) {
  return (url: string) =>
    Effect.gen(function*(_) {
      const staticFile: StaticFile = {}

      return staticFile
    })
}
