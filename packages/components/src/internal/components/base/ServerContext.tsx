/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { createContext, FC, useContext, useReducer } from 'react';
import { LabKey } from '@labkey/api';

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

export interface ServerContextProviderProps {
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

export const ServerContextConsumer = Context.Consumer;

export const withAppUser = (ctx: LabKey): ServerContext => {
    return Object.assign({}, ctx, {
        container: new Container(ctx.container),
        user: new User(ctx.user),
    });
};
