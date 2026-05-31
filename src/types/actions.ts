export type SuccessResult<T = void> = { success: true; data: T }
export type ErrorResult = { success: false; error: string }
export type ActionResult<T = void> = SuccessResult<T> | ErrorResult

export function success<T>(data: T): SuccessResult<T> {
  return { success: true, data }
}

export function failure(error: string): ErrorResult {
  return { success: false, error }
}
