/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, createContext, FC, PropsWithChildren, useContext, useMemo, useReducer } from 'react';
import { getServerContext, LabKey } from '@labkey/api';

import { Container } from './models/Container';
import { User } from './models/User';

export type ModuleContext = Record<string, any>;

export interface ServerContext extends LabKey {
    container: Container;
    moduleContext?: ModuleContext;
    user: User;
}

type AppLabKeyDispatch = (context: Partial<ServerContext>) => void;

const Context = createContext<ServerContext>(undefined);
const ContextDispatch = createContext<AppLabKeyDispatch>(undefined);

const serverContextReducer = (state, payload): ServerContext => {
    return Object.assign({}, state, payload);
};

export interface ServerContextProviderProps extends PropsWithChildren {
    initialContext?: ServerContext;
}

export const ServerContextProvider: FC<ServerContextProviderProps> = ({ children, initialContext }) => {
    const [state, dispatch] = useReducer(serverContextReducer, initialContext);

    return (
        <Context.Provider value={state}>
            <ContextDispatch.Provider value={dispatch}>{children}</ContextDispatch.Provider>
        </Context.Provider>
    );
};
ServerContextProvider.displayName = 'ServerContextProvider';

export const hasServerContext = (): boolean => {
    return !!useContext(Context);
};

export const useServerContext = (): ServerContext => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useServerContext must be used within a ServerContext.Provider');
    }
    return context;
};

export const useServerContextDispatch = (): AppLabKeyDispatch => {
    const context = useContext(ContextDispatch);
    if (context === undefined) {
        throw new Error('useServerContextDispatch must be used within a ServerContextDispatch.Provider');
    }
    return context;
};

const ServerContextConsumer = Context.Consumer;

export const withAppUser = (ctx: LabKey): ServerContext => {
    return Object.assign({}, ctx, {
        container: new Container(ctx.container),
        user: new User(ctx.user),
    });
};

/**
 * Use this component wrapper for pages in LKS that need access to useServerContext.
 * @param Component the component you want to wrap
 */
export function withServerContext<T = {}>(Component: ComponentType<T>): FC<T> {
    return (props: PropsWithChildren<T>) => {
        const initialServerContext = useMemo(() => withAppUser(getServerContext()), []);
        return (
            <ServerContextProvider initialContext={initialServerContext}>
                <Component {...props} />
            </ServerContextProvider>
        );
    };
}

export function resolveModuleContext(moduleContext?: ModuleContext): ModuleContext {
    return moduleContext ?? getServerContext().moduleContext;
}
