type TemporaryAnalysisDependencies<T> = {
  upload: () => Promise<unknown>
  createSignedUrl: () => Promise<string>
  analyze: (signedUrl: string) => Promise<T>
  cleanup: () => Promise<unknown>
}

export async function withTemporaryAnalysisObject<T>({
  upload,
  createSignedUrl,
  analyze,
  cleanup,
}: TemporaryAnalysisDependencies<T>): Promise<T> {
  await upload()

  try {
    const signedUrl = await createSignedUrl()
    return await analyze(signedUrl)
  } finally {
    await cleanup()
  }
}
