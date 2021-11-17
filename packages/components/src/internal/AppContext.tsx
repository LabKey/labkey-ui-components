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

export interface NavigationSettings {
    showCurrentContainer: boolean;
}

export interface AppContext {
    api?: ComponentsAPIWrapper;
    navigation?: NavigationSettings;
}

const Context = createContext<AppContext>(undefined);

export interface AppContextProviderProps {
    initialContext?: AppContext;
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children, initialContext }) => {
    const value = useMemo<AppContext>(
        () => ({
            // Provide a default API so that external users don't have to specify it
            api: getDefaultAPIWrapper(),
            // By default we don't show the container in SubNav, but apps can override this
            navigation: { showCurrentContainer: false },
            ...initialContext,
        }),
        [initialContext]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAppContext = (): AppContext => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContext.Provider');
    }
    return context;
};
