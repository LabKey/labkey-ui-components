import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';

import { AppContextTestProvider, AppContextTestProviderProps } from './testHelpers';

/**
 * Use this if you're testing a component that requires a wrapping <AppContextProvider/> to provide context.
 * This test method wraps React Testing Library's `render()` method utilizing the `wrapper` option to specify
 * the React Context provider components.
 * @param node The component under test.
 * @param contexts The contexts to be provided to the underlying React Context providers.
 * @param options Additional `RenderOptions` to supply to the `render()` method.
 */
export function renderWithAppContext<A = any>( // TODO: Can this somehow be an optional generic? Do not want to import "AppContext" here
    node: ReactElement,
    contexts?: AppContextTestProviderProps<A>,
    options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
    // https://github.com/testing-library/react-testing-library/issues/780
    return render(node, {
        wrapper: _props => <AppContextTestProvider {..._props} {...(contexts as AppContextTestProviderProps)} />,
        ...options,
    });
};
