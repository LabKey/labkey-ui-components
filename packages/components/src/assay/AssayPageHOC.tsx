import React, { ComponentType, FC } from 'react';
import { WithRouterProps } from 'react-router';

import { useServerContext } from '../internal/components/base/ServerContext';
import { userCanReadAssays } from '../internal/app/utils';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { isLoading } from '../public/LoadingState';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { NotFound } from '../internal/components/base/NotFound';
import { Alert } from '../internal/components/base/Alert';
import { getActionErrorMessage } from '../internal/util/messaging';
import {
    InjectedAssayModel,
    WithAssayModelProps,
    withAssayModelsFromLocation,
} from '../internal/components/assay/withAssayModels';

/**
 * Returns a higher-order component wrapped with [[withAssayModelsFromLocation]] that provides common
 * "page"-level handling for edge cases (e.g. loading, protocol not found, errors during loading, etc).
 * @param ComponentToWrap: The component definition (e.g. class, function) to wrap.
 * This will have [[InjectedAssayModel]] props injected into it.
 * @param defaultProps: Provide alternative "defaultProps" for this wrapped component.
 */
export function assayPage<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: WithAssayModelProps
): ComponentType<Props & WithAssayModelProps & WithRouterProps> {
    const AssayPageImpl: FC<Props & InjectedAssayModel & WithRouterProps> = props => {
        const { assayModel, params } = props;
        const assayName = params?.protocol;
        const hasProtocol = assayName !== undefined;
        const { user } = useServerContext();

        // TODO should this check for isAssayEnabled()?

        if (!userCanReadAssays(user)) {
            return <InsufficientPermissionsPage title="Assays" />;
        }
        if (
            isLoading(assayModel.definitionsLoadingState) ||
            (hasProtocol && isLoading(assayModel.protocolLoadingState))
        ) {
            return <LoadingPage />;
        }

        if (assayModel.definitionsError || assayModel.protocolError) {
            if (hasProtocol && assayModel.getByName(assayName) === undefined) {
                return <NotFound />;
            }

            return (
                <Alert>{getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}</Alert>
            );
        }

        return <ComponentToWrap {...props} />;
    };

    return withAssayModelsFromLocation(AssayPageImpl, defaultProps);
}
