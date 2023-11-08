import { isLoading, LoadingState } from './LoadingState';

describe('isLoading', () => {
    test('states', () => {
        expect(isLoading(undefined)).toEqual(false);
        expect(isLoading(null)).toEqual(false);
        expect(isLoading(undefined, null)).toEqual(false);
        expect(isLoading(undefined, null, LoadingState.LOADING)).toEqual(true);
        expect(isLoading(undefined, null, LoadingState.LOADED)).toEqual(false);
        expect(isLoading(LoadingState.INITIALIZED, LoadingState.LOADING, LoadingState.LOADED)).toEqual(true);
        expect(isLoading(LoadingState.INITIALIZED)).toEqual(true);
        expect(isLoading(LoadingState.LOADED)).toEqual(false);
        expect(isLoading(LoadingState.LOADED, LoadingState.INITIALIZED)).toEqual(true);
    });
});
