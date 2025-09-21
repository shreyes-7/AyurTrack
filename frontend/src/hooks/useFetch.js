import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for data fetching with loading, error, and retry functionality
 * @param {Function} fetchFunction - The async function that fetches data
 * @param {Array} dependencies - Dependencies array for re-fetching
 * @param {Object} options - Configuration options
 */
const useFetch = (fetchFunction, dependencies = [], options = {}) => {
    const {
        immediate = true,
        onSuccess,
        onError,
        initialData = null
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        try {
            setLoading(true);
            setError(null);

            const result = await fetchFunction(...args);
            const responseData = result?.data || result;

            setData(responseData);

            if (onSuccess) {
                onSuccess(responseData);
            }

            return { success: true, data: responseData };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }

            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, onSuccess, onError]);

    const retry = useCallback(() => {
        return execute();
    }, [execute]);

    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setLoading(false);
    }, [initialData]);

    // Auto-execute on mount and dependency changes
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, dependencies);

    return {
        data,
        loading,
        error,
        execute,
        retry,
        reset
    };
};

/**
 * Hook for making POST requests with form handling
 * @param {Function} submitFunction - The async function to submit data
 * @param {Object} options - Configuration options
 */
export const useSubmit = (submitFunction, options = {}) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const submit = useCallback(async (data) => {
        try {
            setSubmitting(true);
            setError(null);
            setSuccess(false);

            const result = await submitFunction(data);

            setSuccess(true);

            if (options.onSuccess) {
                options.onSuccess(result);
            }

            return { success: true, data: result };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Submission failed';
            setError(errorMessage);

            if (options.onError) {
                options.onError(errorMessage);
            }

            return { success: false, error: errorMessage };
        } finally {
            setSubmitting(false);
        }
    }, [submitFunction, options]);

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
        setSubmitting(false);
    }, []);

    return {
        submit,
        submitting,
        error,
        success,
        reset
    };
};

/**
 * Hook for debounced search functionality
 * @param {Function} searchFunction - The async search function
 * @param {number} delay - Debounce delay in milliseconds
 */
export const useSearch = (searchFunction, delay = 300) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);

                const searchResults = await searchFunction(query);
                setResults(searchResults?.data || searchResults || []);
            } catch (err) {
                setError(err.message);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [query, searchFunction, delay]);

    return {
        query,
        setQuery,
        results,
        loading,
        error
    };
};

/**
 * Hook for local storage with JSON serialization
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};

export default useFetch;