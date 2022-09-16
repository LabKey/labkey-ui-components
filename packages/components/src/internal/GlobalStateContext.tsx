import React, { createContext, PropsWithChildren, ReactElement, useContext, useMemo } from 'react';

import { NavigationGlobalContext } from './components/navigation/types';
import { useNavigationContextState } from './components/navigation/NavigationContext';

export interface GlobalStateContext {
    navigation?: NavigationGlobalContext;
}

export type ExtendableGlobalStateContext<T> = T & GlobalStateContext;

const Context = createContext<ExtendableGlobalStateContext<any>>(undefined);

export interface GlobalStateContextProviderProps<T> {
    initialContext?: ExtendableGlobalStateContext<T>;
}

export function GlobalStateContextProvider<T>({
    children,
    initialContext,
}: PropsWithChildren<GlobalStateContextProviderProps<T>>): ReactElement {
    const navigation = useNavigationContextState();

    const value = useMemo<GlobalStateContext>(
        () => ({
            navigation,
            ...initialContext,
        }),
        [initialContext, navigation]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useGlobalStateContext<T>(): ExtendableGlobalStateContext<T> {
    const context = useContext<ExtendableGlobalStateContext<T>>(Context);
    if (context === undefined) {
        throw new Error('useGlobalStateContext must be used within GlobalStateContext.Provider');
    }
    return context;
}
