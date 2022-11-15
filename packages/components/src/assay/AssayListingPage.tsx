import React, { FC, memo, ReactNode } from 'react';

import { CommonPageProps } from '../internal/models';
import { useServerContext } from '../internal/components/base/ServerContext';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { userCanReadAssays } from '../internal/app/utils';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { ASSAYS_KEY } from '../internal/app/constants';
import { Page } from '../internal/components/base/Page';

import { AssayDesignEmptyAlert } from '../internal/components/assay/AssayDesignEmptyAlert';
import { Section } from '../internal/components/base/Section';

import { AssayTypeSummary } from './AssayTypeSummary';
import { useAssayAppContext } from './AssayAppContext';

const ASSAY_CAPTION = 'Capture analytical data about samples';

interface Props {
    buttons: ReactNode;
}

export const AssayListingPage: FC<Props & CommonPageProps> = memo(props => {
    const { buttons, menu, navigate } = props;
    const { user } = useServerContext();
    const { assayTypes, excludedAssayProviders } = useAssayAppContext();
    const pageTitle = 'Assays';

    if (!userCanReadAssays(user)) return <InsufficientPermissionsPage title={pageTitle} />;

    if (!menu.isLoaded) {
        return <LoadingPage title={pageTitle} />;
    }

    const hasItems = menu.hasSectionItems(ASSAYS_KEY);

    return (
        <Page title={pageTitle}>
            <Section caption={ASSAY_CAPTION} context={buttons} title="Assays">
                {hasItems && (
                    <AssayTypeSummary
                        assayTypes={assayTypes}
                        excludedAssayProviders={excludedAssayProviders}
                        navigate={navigate}
                    />
                )}
                {!hasItems && <AssayDesignEmptyAlert user={user} />}
            </Section>
        </Page>
    );
});
