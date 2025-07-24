import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = res.statusText;
    try {
      const jsonData = await res.json();
      text = jsonData.message || text;
    } catch (parseError) {
      // Fall back to text response if JSON parsing fails
      try {
        text = (await res.text()) || res.statusText;
      } catch (textError) {
        text = res.statusText;
      }
    }
    
    // Handle authentication errors
    if (res.status === 401 || res.status === 403) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (Vercel), always use Railway backend
  if (import.meta.env.PROD) {
    return 'https://primeedge-production.up.railway.app';
  }
  
  // In development, use local backend (empty string for same-origin)
  return '';
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add JWT auth header if available
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Construct full URL
  const baseUrl = getApiBaseUrl();
  const fullUrl = baseUrl + url;
  
  // Debug logging for development
  if (import.meta.env.DEV) {
    console.log('API Request:', { method, baseUrl, fullUrl });
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers: { ...headers, ...extraHeaders },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add JWT auth header if available
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Construct full URL for query
    const baseUrl = getApiBaseUrl();
    const fullUrl = baseUrl + (queryKey.join("/") as string);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
