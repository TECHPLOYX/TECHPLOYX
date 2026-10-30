type ApiResponse<T = any> = { data: T };

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  const text = await response.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = { error: text.slice(0, 500) }; }
  }
  if (!response.ok) {
    const message = data?.error || data?.message || ('Request failed: ' + response.status);
    const error = new Error(String(message));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return { data: data as T };
}

export const api = {
  post: <T = any>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body),
  get: <T = any>(path: string) => request<T>('GET', path),
};
