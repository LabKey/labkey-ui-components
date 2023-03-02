import React, { createContext, ReactElement, ReactNode, useContext } from "react";
import {ComponentKeys} from "./models";
import {EHRComponents} from "./index";

export interface DynamicLoadingContext {
    hooks: ComponentKeys;
}

const Context = createContext<DynamicLoadingContext>({hooks: EHRComponents});

export const DynamicLoadingContextProvider = (customComponents: ComponentKeys, children: ReactNode): ReactElement => {

    const value = {hooks: {...EHRComponents, ...customComponents}};

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDynamicLoadingContext<T>(): DynamicLoadingContext {
    const context = useContext<DynamicLoadingContext>(Context);
    if (context === undefined) {
        throw new Error('useDynamicLoadingContext must be used within DynamicLoadingContextProvider');
    }
    return context;
}