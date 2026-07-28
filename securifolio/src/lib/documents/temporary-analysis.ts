type TemporaryAnalysisDependencies<T> = {
  upload: () => Promise<unknown>
  createSignedUrl: () => Promise<string>
  analyze: (signedUrl: string) => Promise<T>
  cleanup: () => Promise<unknown>
}

type DefinitiveOperationResult = {
  success: boolean
  error?: string
}

type DefinitiveObjectDependencies<T extends DefinitiveOperationResult> = {
  operation: () => Promise<T>
  cleanup: () => Promise<unknown>
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'erreur inconnue'
}

function cleanupFailureMessage(error: unknown) {
  return `Nettoyage du fichier impossible : ${errorMessage(error)}`
}

export async function withTemporaryAnalysisObject<T>({
  upload,
  createSignedUrl,
  analyze,
  cleanup,
}: TemporaryAnalysisDependencies<T>): Promise<T> {
  let primaryError: unknown

  try {
    await upload()
    const signedUrl = await createSignedUrl()
    return await analyze(signedUrl)
  } catch (error) {
    primaryError = error
    throw error
  } finally {
    try {
      await cleanup()
    } catch (cleanupError) {
      console.error('Temporary analysis object cleanup failed:', cleanupError)

      if (primaryError === undefined) {
        throw cleanupError
      }
    }
  }
}

export async function withDefinitiveObjectRetention<
  T extends DefinitiveOperationResult,
>({
  operation,
  cleanup,
}: DefinitiveObjectDependencies<T>): Promise<T> {
  let result: T

  try {
    result = await operation()
  } catch (operationError) {
    try {
      await cleanup()
    } catch (cleanupError) {
      console.error('Nettoyage de l’objet définitif impossible:', cleanupError)
      throw new Error(
        `${errorMessage(operationError)} ${cleanupFailureMessage(cleanupError)}`,
      )
    }

    throw operationError
  }

  if (result.success) {
    return result
  }

  try {
    await cleanup()
    return result
  } catch (cleanupError) {
    console.error('Nettoyage de l’objet définitif impossible:', cleanupError)
    return {
      ...result,
      error: `${result.error || 'Échec de l’opération.'} ${cleanupFailureMessage(cleanupError)}`,
    } as T
  }
}
