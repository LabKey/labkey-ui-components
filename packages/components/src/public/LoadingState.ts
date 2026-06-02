/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
