import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

import { AppContextTestProvider, AppContextTestProviderProps } from './testHelpers';

// https://github.com/testing-library/react-testing-library/issues/780
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const renderWithAppContext = (
    node: ReactElement,
    props?: Partial<AppContextTestProviderProps>,
    options?: Omit<RenderOptions, 'wrapper'>
) => {
    return render(node, {
        wrapper: _props => <AppContextTestProvider {..._props} {...(props as AppContextTestProviderProps)} />,
        ...options,
    });
};
