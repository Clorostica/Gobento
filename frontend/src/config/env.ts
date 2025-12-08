/**
 * Environment configuration
 */

export const env = {
  API_URL: import.meta.env.VITE_API as string,
  AUTH0_DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN as string,
  AUTH0_CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID as string,
} as const;

/**
 * Validates that all required environment variables are set
 */
export const validateEnv = (): void => {
  const required = ["API_URL", "AUTH0_DOMAIN", "AUTH0_CLIENT_ID"] as const;
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};
