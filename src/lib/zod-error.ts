export function getZodErrorMessage(result: { success: boolean; error?: { issues: { message: string }[] } }): string {
  if (!result.success && result.error) {
    return result.error.issues.map((issue) => issue.message).join(', ')
  }
  return 'Datos inválidos'
}
