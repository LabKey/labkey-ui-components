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

/**
 * GlobalStateContext is a context for our apps that allows for persistence and mutations of global
 * (application-wide) context. This context is intended to be used for persisting state/actions that are useful
 * throughout the component hierarchy. This prevents the need for "prop drilling" these types of state/actions down
 * to individual components in the hierarchy through parent components that otherwise do not need this context.
 * That said, if you're looking to add to the GlobalStateContext please be sure that having your state/actions at this
 * level is useful across the application. You should NOT add your state/actions to GlobalStateContext if the
 * state/actions are only used/called within a localized component hierarchy. In that case use either component state
 * and pass it down or use a page-level context instead.
 *
 * If you're extending this context please review the context properties already in place as there may be an existing
 * namespace in this context that is most appropriate. Otherwise, another top-level property can be added.
 */
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
