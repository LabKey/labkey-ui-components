import React, { FC, memo } from 'react';

import { Button } from 'react-bootstrap';

import { CommonPageProps } from '../internal/models';
import { useServerContext } from '../internal/components/base/ServerContext';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { userCanReadAssays } from '../internal/app/utils';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { ASSAYS_KEY, NEW_ASSAY_DESIGN_HREF, NEW_STANDARD_ASSAY_DESIGN_HREF } from '../internal/app/constants';
import { Page } from '../internal/components/base/Page';

import { AssayDesignEmptyAlert } from '../internal/components/assay/AssayDesignEmptyAlert';
import { Section } from '../internal/components/base/Section';

import { AssayTypeSummary } from './AssayTypeSummary';
import { useAssayAppContext } from './useAssayAppContext';

const ASSAY_CAPTION = 'Capture analytical data about samples';

export const AssayListingPage: FC<CommonPageProps> = memo(props => {
    const { menu, navigate } = props;
    const { user } = useServerContext();
    const { assayTypes, excludedAssayProviders } = useAssayAppContext();
    const pageTitle = 'Assays';

    if (!userCanReadAssays(user)) return <InsufficientPermissionsPage title={pageTitle} />;

    if (!menu.isLoaded) {
        return <LoadingPage title={pageTitle} />;
    }

    let button;
    let createUrl;
    if (user.hasDesignAssaysPermission()) {
        createUrl = assayTypes?.length === 1 ? NEW_STANDARD_ASSAY_DESIGN_HREF : NEW_ASSAY_DESIGN_HREF;
        button = (
            <Button bsStyle="success" href={createUrl.toHref()}>
                Create Assay Design
            </Button>
        );
    }

    const hasItems = menu.hasSectionItems(ASSAYS_KEY);

    return (
        <Page title={pageTitle}>
            <Section caption={ASSAY_CAPTION} context={button} title={pageTitle}>
                {hasItems && (
                    <AssayTypeSummary
                        assayTypes={assayTypes}
                        excludedAssayProviders={excludedAssayProviders}
                        navigate={navigate}
                    />
                )}
                {!hasItems && <AssayDesignEmptyAlert user={user} actionURL={createUrl} />}
            </Section>
        </Page>
    );
});
