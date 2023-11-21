import React, { ComponentType, createContext, ReactElement, useContext, useMemo, useState } from 'react';

export interface SubNavContext {
    SubNav: ComponentType;
    setSubNav: (subNav?: ComponentType) => void;
}

const Context = createContext<SubNavContext>(undefined);

export function SubNavContextProvider({ children }): ReactElement {
    const [component, setComponent] = useState<ComponentType>(undefined);
    const value = useMemo(() => ({ SubNav: component, setSubNav: setComponent }), [component]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubNavContext(): SubNavContext {
    const context = useContext<SubNavContext>(Context);

    if (context === undefined) {
        throw new Error('useSubNavContext must be used within a SubNavContextProvider');
    }
    return context;
}
