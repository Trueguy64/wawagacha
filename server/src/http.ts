import type { z, ZodTypeAny } from "zod";

/** Thrown by controllers; turned into a JSON response by the error middleware. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Validates `data` against `schema` or throws a 400 carrying the first issue. */
export function validate<S extends ZodTypeAny>(schema: S, data: unknown, fallback: string): z.output<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? fallback);
  return parsed.data;
}
