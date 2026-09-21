export function authErrorMessage(error: { status?: number; code?: string; message?: string; name?: string }): string {
  if ((error.status ?? 0) >= 500 || error.code === 'PGRST002' ||
      /timeout|timed out|fetch|network|abort/i.test(`${error.name ?? ''} ${error.message ?? ''}`)) {
    return 'O serviço de login está temporariamente indisponível. Aguarde alguns instantes e tente novamente.';
  }
  return error.message || 'Não foi possível concluir a operação. Tente novamente.';
}
