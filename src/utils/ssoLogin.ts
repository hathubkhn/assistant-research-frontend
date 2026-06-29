export function storeSsoAuthToken(token: string, provider: string): void {
  let cleanToken = token
  if (cleanToken.startsWith('Token ')) {
    cleanToken = cleanToken.substring(6)
  }
  localStorage.setItem('authToken', cleanToken)
  localStorage.setItem('authProvider', provider)
}

export async function syncAuthContextAfterSso(
  checkAuth: () => Promise<unknown | null>,
): Promise<boolean> {
  const user = await checkAuth()
  return user !== null
}
