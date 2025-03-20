import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Interface for API query options
 */
interface ApiQueryOptions<T> {
  /**
   * Initial data to use before the query is resolved
   */
  initialData?: T;

  /**
   * Whether to enable the query
   */
  enabled?: boolean;

  /**
   * Refetch interval in milliseconds
   */
  refetchInterval?: number;

  /**
   * Callback to run when the query is successful
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback to run when the query fails
   */
  onError?: (error: Error) => void;
}

/**
 * Interface for API query result
 */
interface ApiQueryResult<T> {
  /**
   * The data returned from the query
   */
  data: T | undefined;

  /**
   * Whether the query is currently loading
   */
  isLoading: boolean;

  /**
   * Whether the query is currently fetching (initial load or refetch)
   */
  isFetching: boolean;

  /**
   * Whether the query has errored
   */
  isError: boolean;

  /**
   * The error returned from the query
   */
  error: Error | null;

  /**
   * Function to manually refetch the data
   */
  refetch: () => Promise<T>;
}

/**
 * Custom hook for data fetching with loading and error states
 *
 * @param queryFn Function that returns a promise with the data
 * @param options Query options
 * @returns Query result
 */
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: ApiQueryOptions<T> = {}
): ApiQueryResult<T> {
  const {
    initialData,
    enabled = true,
    refetchInterval,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isFetching, setIsFetching] = useState<boolean>(enabled);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Create a stable reference for the query function
  const queryRef = useRef(queryFn);
  useEffect(() => {
    queryRef.current = queryFn;
  }, [queryFn]);

  const fetchData = useCallback(async (): Promise<T> => {
    setIsFetching(true);
    setIsError(false);
    setError(null);

    try {
      const result = await queryRef.current();
      setData(result);
      setIsLoading(false);
      setIsFetching(false);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setIsError(true);
      setError(errorObj);
      setIsLoading(false);
      setIsFetching(false);

      if (onError) {
        onError(errorObj);
      }

      throw errorObj;
    }
  }, [onSuccess, onError]);

  // Initial fetch and refetch when queryFn changes
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    // Force a refetch by calling fetchData
    fetchData().catch(() => {
      // Error is already handled in fetchData
    });
  }, [enabled, fetchData, queryFn]); // Add queryFn to dependencies to refetch when it changes

  // Set up refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchData().catch(() => {
        // Error is already handled in fetchData
      });
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refetchInterval, fetchData]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: fetchData
  };
}

/**
 * Interface for mutation options
 */
interface MutationOptions<TData, TVariables> {
  /**
   * Callback to run when the mutation is successful
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Callback to run when the mutation fails
   */
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Interface for mutation result
 */
interface MutationResult<TData> {
  /**
   * The data returned from the mutation
   */
  data: TData | undefined;

  /**
   * Whether the mutation is currently loading
   */
  isLoading: boolean;

  /**
   * Whether the mutation has errored
   */
  isError: boolean;

  /**
   * The error returned from the mutation
   */
  error: Error | null;

  /**
   * Whether the mutation has been called
   */
  isIdle: boolean;

  /**
   * Whether the mutation has succeeded
   */
  isSuccess: boolean;

  /**
   * Reset the mutation state
   */
  reset: () => void;
}

/**
 * Interface for mutation function
 */
type MutationFn<TData, TVariables> = (variables: TVariables) => Promise<TData>;

/**
 * Custom hook for data mutations
 *
 * @param mutationFn Function that returns a promise with the data
 * @param options Mutation options
 * @returns Mutation result and mutation function
 */
export function useApiMutation<TData, TVariables = unknown>(
  mutationFn: MutationFn<TData, TVariables>,
  options: MutationOptions<TData, TVariables> = {}
): [
  (variables: TVariables) => Promise<TData>,
  MutationResult<TData>
] {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<TData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isIdle, setIsIdle] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const reset = useCallback(() => {
    setData(undefined);
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setIsIdle(true);
    setIsSuccess(false);
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setIsIdle(false);
      setIsError(false);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsLoading(false);
        setIsSuccess(true);

        if (onSuccess) {
          onSuccess(result, variables);
        }

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setIsError(true);
        setError(errorObj);
        setIsLoading(false);

        if (onError) {
          onError(errorObj, variables);
        }

        throw errorObj;
      }
    },
    [mutationFn, onSuccess, onError]
  );

  return [
    mutate,
    {
      data,
      isLoading,
      isError,
      error,
      isIdle,
      isSuccess,
      reset
    }
  ];
}
