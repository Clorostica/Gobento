import { useState, useCallback, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const useAuth = () => {
  const { getIdTokenClaims, isAuthenticated, isLoading } = useAuth0();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);

  const loadToken = useCallback(async () => {
    if (!isAuthenticated) {
      setToken(null);
      return;
    }

    setIsTokenLoading(true);
    try {
      const tokenClaims = await getIdTokenClaims();
      if (tokenClaims?.__raw) {
        setToken(tokenClaims.__raw);
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error("Error loading token:", error);
      setToken(null);
    } finally {
      setIsTokenLoading(false);
    }
  }, [isAuthenticated, getIdTokenClaims]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadToken();
    } else if (!isAuthenticated) {
      setToken(null);
    }
  }, [isAuthenticated, isLoading, loadToken]);

  return {
    token,
    isLoading: isTokenLoading || isLoading,
    loadToken,
  };
};
