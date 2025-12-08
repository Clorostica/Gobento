import { useMemo } from "react";
import { ApiClient } from "@/utils/apiClient";
import { useAuth } from "./useAuth";

export const useApiClient = () => {
  const { token } = useAuth();

  const apiClient = useMemo(() => {
    const client = new ApiClient(token);
    return client;
  }, [token]);

  return apiClient;
};
