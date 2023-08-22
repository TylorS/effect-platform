import * as Data from "@effect/data/Data"
import type { Method } from "@effect/platform/Http/Method"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"

export const TypeId = Symbol.for("@effect/platform/Http/StaticFileError")
export type TypeId = typeof TypeId

export type StaticFileError = MethodNotSupported | FileNotFound

export namespace StaticFileError {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface Proto extends Data.Case {
    readonly [TypeId]: TypeId
    readonly _tag: string
  }

  /**
   * @since 1.0.0
   */
  export type ProvidedFields = TypeId | "_tag" | keyof Data.Case
}

/**
 * @since 1.0.0
 * @category error
 */
export interface MethodNotSupported extends StaticFileError.Proto {
  readonly _tag: "MethodNotSupported"
  readonly request: ServerRequest.ServerRequest
  readonly methods: ReadonlyArray<Method>
}

const make = <A extends StaticFileError>(tag: A["_tag"]) => (props: Omit<A, StaticFileError.ProvidedFields>): A =>
  Data.struct({
    [TypeId]: TypeId,
    _tag: tag,
    ...props
  } as A)

/**
 * @since 1.0.0
 * @category error
 */
export const MethodNotSupported: (
  props: Omit<MethodNotSupported, StaticFileError.ProvidedFields>
) => MethodNotSupported = make("MethodNotSupported")

/**
 * @since 1.0.0
 * @category error
 */
export interface FileNotFound extends StaticFileError.Proto {
  readonly _tag: "FileNotFound"
  readonly request: ServerRequest.ServerRequest
}

/**
 * @since 1.0.0
 * @category error
 */
export const FileNotFound: (
  props: Omit<FileNotFound, StaticFileError.ProvidedFields>
) => FileNotFound = make("FileNotFound")
