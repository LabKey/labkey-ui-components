export enum LoadingState {
    // The model has been initialized but not loaded
    INITIALIZED = 'INITIALIZED',
    // The model is currently loading
    LOADING = 'LOADING',
    // The model is loaded
    LOADED = 'LOADED',
}

export const isLoading = (loadingState: LoadingState): boolean => {
    return loadingState === LoadingState.INITIALIZED || loadingState === LoadingState.LOADING;
};
