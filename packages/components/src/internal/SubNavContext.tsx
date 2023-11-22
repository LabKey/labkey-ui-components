import React, {
    ComponentType,
    createContext,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export interface SubNavContext {
    SubNav: ComponentType;
    setSubNav: (subNav?: ReactNode) => void;
}

const Context = createContext<SubNavContext>(undefined);

export function SubNavContextProvider({ children }): ReactElement {
    const [component, setComponent] = useState<ComponentType>(undefined);
    // Note: while this does seem like an unnecessary wrapper around setComponent it's actually necessary, because we
    // need to use the callback version of setComponent in order to set the value to a function, otherwise if you pass
    // an FC to setComponent it will call function, which will trigger a render.
    const setSubNav = useCallback((SubNav: ComponentType) => {
        setComponent(() => SubNav);
    }, []);
    const value = useMemo(() => ({ SubNav: component, setSubNav }), [component, setSubNav]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubNavContext(): SubNavContext {
    const context = useContext<SubNavContext>(Context);

    if (context === undefined) {
        throw new Error('useSubNavContext must be used within a SubNavContextProvider');
    }
    return context;
}
