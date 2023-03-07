import React, {ComponentClass, createContext, FC, FunctionComponent, ReactElement, ReactNode, useContext} from "react";

export interface ComponentKeys {
    [key: string]: string | FunctionComponent<{}> | ComponentClass<{}, any>
}

export interface DynamicLoadingContext {
    hooks: ComponentKeys;
}

const Context = createContext<DynamicLoadingContext>(undefined);

export const DynamicComponentContextProvider: FC<DynamicLoadingContext> = props => {

    const value = {hooks: props.hooks};

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
}

export function useDynamicComponentContext<T>(): DynamicLoadingContext {
    const context = useContext<DynamicLoadingContext>(Context);
    if (context === undefined) {
        throw new Error('useDynamicLoadingContext must be used within DynamicLoadingContextProvider');
    }
    return context;
}
