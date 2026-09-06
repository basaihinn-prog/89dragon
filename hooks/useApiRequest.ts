import { useState, useCallback, useRef, useEffect } from "react";

interface ApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiRequestReturn<T, P extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  cancel: () => void;
}

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useApiRequest<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<T>,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T, P> {
  const { onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: ApiRequestState<T>) => {
    if (mountedRef.current && !cancelledRef.current) {
      setState(newState);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    attemptRef.current = retryCount + 1;
  }, [retryCount]);

  const execute = useCallback(async (...params: P): Promise<T | null> => {
    cancelledRef.current = false;
    safeSetState({ ...state, loading: true, error: null });
    attemptRef.current = 0;

    const tryRequest = async (): Promise<T | null> => {
      if (cancelledRef.current || !mountedRef.current) {
        return null;
      }

      try {
        const result = await apiFunction(...params);
        if (mountedRef.current && !cancelledRef.current) {
          safeSetState({ data: result, loading: false, error: null });
          onSuccess?.(result);
        }
        return result;
      } catch (err: any) {
        if (!mountedRef.current || cancelledRef.current) {
          return null;
        }

        const errorMessage = err?.message || "An error occurred";
        
        if (attemptRef.current < retryCount) {
          attemptRef.current++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return tryRequest();
        }
        
        safeSetState({ data: null, loading: false, error: errorMessage });
        onError?.(errorMessage);
        return null;
      }
    };

    return tryRequest();
  }, [apiFunction, onSuccess, onError, retryCount, retryDelay, safeSetState, state]);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    safeSetState({ data: null, loading: false, error: null });
    attemptRef.current = 0;
  }, [safeSetState]);

  const setData = useCallback((data: T | null) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, data }));
    }
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    setData,
    cancel,
  };
}

interface BatchRequestResult<T> {
  results: (T | null)[];
  errors: (string | null)[];
  allSuccessful: boolean;
}

export async function batchApiRequests<T>(
  requests: (() => Promise<T>)[]
): Promise<BatchRequestResult<T>> {
  const results: (T | null)[] = [];
  const errors: (string | null)[] = [];

  const responses = await Promise.allSettled(requests.map(fn => fn()));

  for (const response of responses) {
    if (response.status === "fulfilled") {
      results.push(response.value);
      errors.push(null);
    } else {
      results.push(null);
      errors.push(response.reason?.message || "Request failed");
    }
  }

  return {
    results,
    errors,
    allSuccessful: errors.every(e => e === null),
  };
}

export function createApiErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.status === 401) return "Session expired. Please log in again.";
  if (error?.response?.status === 403) return "You don't have permission to do this.";
  if (error?.response?.status === 404) return "The requested resource was not found.";
  if (error?.response?.status >= 500) return "Server error. Please try again later.";
  if (error?.code === "NETWORK_ERROR") return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
