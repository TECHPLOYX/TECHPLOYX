type ApiResponse<T> = { data: T };

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return { data: data as T };
}

export const api = {
  get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>("GET", path);
  },
  post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body);
  },
  put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, body);
  },
};
