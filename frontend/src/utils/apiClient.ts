import { env } from "@/config/env";
import type { ApiError, ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Converts snake_case object keys to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};

/**
 * Recursively converts object keys from snake_case to camelCase
 */
export const convertKeysToCamelCase = <T>(obj: any): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase) as T;
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        snakeToCamel(key),
        typeof value === "object" && value !== null
          ? convertKeysToCamelCase(value)
          : value,
      ])
    ) as T;
  }

  return obj;
};

/**
 * Generic API request function with error handling
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${env.API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = "Unknown error";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          errorMessage = await response.text().catch(() => "Unknown error");
        }
      } catch {
        errorMessage = await response.text().catch(() => "Unknown error");
      }
      throw new ApiClientError(errorMessage, response.status);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new ApiClientError("Server returned non-JSON response");
    }

    const data = await response.json();
    return convertKeysToCamelCase<T>(data);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};

/**
 * API request with authentication
 */
export const authenticatedRequest = async <T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

/**
 * API client class for organized endpoint calls
 */
export class ApiClient {
  constructor(private token: string | null = null) {}

  setToken(token: string | null): void {
    this.token = token;
  }

  async get<T>(endpoint: string): Promise<T> {
    if (this.token) {
      return authenticatedRequest<T>(endpoint, this.token, { method: "GET" });
    }
    return apiRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const options: RequestInit = {
      method: "POST",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    if (this.token) {
      return authenticatedRequest<T>(endpoint, this.token, options);
    }
    return apiRequest<T>(endpoint, options);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const options: RequestInit = {
      method: "PUT",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    if (this.token) {
      return authenticatedRequest<T>(endpoint, this.token, options);
    }
    return apiRequest<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<T> {
    if (this.token) {
      return authenticatedRequest<T>(endpoint, this.token, {
        method: "DELETE",
      });
    }
    return apiRequest<T>(endpoint, { method: "DELETE" });
  }
}
