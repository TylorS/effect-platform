import * as Context from "@effect/data/Context"
import type * as Option from "@effect/data/Option"
import type * as Cache from "@effect/io/Cache"
import type * as Cause from "@effect/io/Cause"

export const TypeId = Symbol.for("@effect/platform/Http/StaticFiles")
export type TypeId = typeof TypeId

export interface StaticFiles {
  readonly [TypeId]: TypeId

  // A cache of urls that map to file paths on the file system
  readonly staticFiles: Cache.Cache<string, Cause.NoSuchElementException, StaticFile>
}

export const StaticFiles = Context.Tag<StaticFiles>(TypeId)

export interface StaticFile {
  /**
   * The absolute file path on the file system
   */
  readonly filePath: string
  /**
   * The content type of the file
   */
  readonly contentType: string
  /**
   * The file compressions that are available for this file, if any.
   */
  readonly compressions: FileCompressions
  /**
   * The etag of the file
   */
  readonly etag: Option.Option<string>
}

/**
 * Map of Accept-Encoding header values to file paths
 */
export interface FileCompressions {
  readonly [AcceptEncoding: string]: string
}
