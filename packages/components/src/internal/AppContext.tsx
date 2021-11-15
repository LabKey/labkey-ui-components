/*
 * Copyright (c) 2021 LabKey Corporation
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
import React, { createContext, FC, useContext, useMemo } from 'react';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from './APIWrapper';

export interface AppContext {
    api: ComponentsAPIWrapper;
}

const Context = createContext<AppContext>(undefined);

export interface AppContextProviderProps {
    initialContext?: AppContext;
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children, initialContext }) => {
    // Provide a default API so that external users don't have to specify it
    const value = useMemo<AppContext>(() => ({ api: getDefaultAPIWrapper(), ...initialContext }), [initialContext]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAppContext = (): AppContext => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContext.Provider');
    }
    return context;
};
