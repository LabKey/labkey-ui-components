import React, { FC, memo, useCallback } from 'react';

import { WithRouterProps } from 'react-router';

import { InjectedAssayModel, withAssayModelsFromLocation } from '../internal/components/assay/withAssayModels';
import { AppURL } from '../internal/url/AppURL';
import { ASSAYS_KEY } from '../internal/app/constants';

import { AssaySubNavMenu } from './AssaySubNavMenu';

type Props = InjectedAssayModel & WithRouterProps;

const AssaySubNavImpl: FC<Props> = memo(props => {
    const getUrl = useCallback((provider, protocol, text): AppURL => {
        return text === 'Overview'
            ? AppURL.create(ASSAYS_KEY, provider, protocol)
            : AppURL.create(ASSAYS_KEY, provider, protocol, text.toLowerCase());
    }, []);

    return <AssaySubNavMenu getUrl={getUrl} {...props} />;
});

export const AssaySubNav = withAssayModelsFromLocation(AssaySubNavImpl);
