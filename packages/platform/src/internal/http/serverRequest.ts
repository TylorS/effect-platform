import * as Context from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as FormData from "@effect/platform/Http/FormData"
import * as IncomingMessage from "@effect/platform/Http/IncomingMessage"
import * as Error from "@effect/platform/Http/ServerError"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as Schema from "@effect/schema/Schema"

/** @internal */
export const TypeId: ServerRequest.TypeId = Symbol.for("@effect/platform/Http/ServerRequest") as ServerRequest.TypeId

/** @internal */
export const serverRequestTag = Context.Tag<ServerRequest.ServerRequest>(TypeId)

/** @internal */
export const formDataRecord = Effect.map(
  Effect.flatMap(serverRequestTag, (request) => request.formData),
  FormData.toRecord
)

/** @internal */
export const schemaHeaders = <I extends Readonly<Record<string, string>>, A>(schema: Schema.Schema<I, A>) => {
  const parse = IncomingMessage.schemaHeaders(schema)
  return Effect.flatMap(serverRequestTag, parse)
}

/** @internal */
export const schemaBodyJson = <I, A>(schema: Schema.Schema<I, A>) => {
  const parse = IncomingMessage.schemaBodyJson(schema)
  return Effect.flatMap(serverRequestTag, parse)
}

/** @internal */
export const schemaBodyUrlParams = <I extends Readonly<Record<string, string>>, A>(schema: Schema.Schema<I, A>) => {
  const parse = IncomingMessage.schemaBodyUrlParams(schema)
  return Effect.flatMap(serverRequestTag, parse)
}

/** @internal */
export const schemaFormData = <I extends Readonly<Record<string, string | ReadonlyArray<globalThis.File>>>, A>(
  schema: Schema.Schema<I, A>
) => {
  const parse = FormData.schemaRecord(schema)
  return Effect.flatMap(
    Effect.flatMap(serverRequestTag, (request) => request.formData),
    parse
  )
}

/** @internal */
export const schemaFormDataJson = <I, A>(schema: Schema.Schema<I, A>) => {
  const parse = FormData.schemaJson(schema)
  return (field: string) =>
    Effect.flatMap(serverRequestTag, (request) =>
      Effect.flatMap(
        request.formData,
        (formData) =>
          Effect.catchTag(
            parse(formData, field),
            "FormDataError",
            (error) =>
              Effect.fail(
                Error.RequestError({
                  reason: "Decode",
                  request,
                  error: error.error
                })
              )
          )
      ))
}
