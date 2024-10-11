export enum LoadingState {
    // The model has been initialized but not loaded
    INITIALIZED = 'INITIALIZED',
    // The model is currently loading
    LOADING = 'LOADING',
    // The model is loaded
    LOADED = 'LOADED',
}

/**
 * Returns true if any LoadingState(s) are considered to be loading. Falsy values are considered not loading.
 */
export const isLoading = (...loadingStates: LoadingState[]): boolean => {
    return (
        !!loadingStates &&
        loadingStates.some(ls => ls === LoadingState.INITIALIZED || ls === LoadingState.LOADING)
    );
};
