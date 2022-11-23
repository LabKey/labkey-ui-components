/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { Button } from 'react-bootstrap';

import { AppURL } from '../internal/url/AppURL';
import { useServerContext } from '../internal/components/base/ServerContext';
import { Page } from '../internal/components/base/Page';
import { Section } from '../internal/components/base/Section';
import { isSampleStatusEnabled } from '../internal/app/utils';
import { RequiresPermission } from '../internal/components/base/Permissions';

import { SampleTypeEmptyAlert } from '../internal/components/samples/SampleEmptyAlert';

import { NEW_SAMPLE_TYPE_HREF, SAMPLES_KEY } from '../internal/app/constants';
import { CommonPageProps } from '../internal/models';
import { LoadingPage } from '../internal/components/base/LoadingPage';

import { SampleTypeSummary } from './SampleTypeSummary';

import { useSampleTypeAppContext } from './useSampleTypeAppContext';

export const SampleTypeListingPage: FC<CommonPageProps> = memo(props => {
    const { menu, navigate } = props;
    const { moduleContext, user } = useServerContext();
    const { sampleTypeListingCaption } = useSampleTypeAppContext();
    const title = 'Sample Types';

    if (!menu.isLoaded) {
        return <LoadingPage title={title} />;
    }

    const hasSampleTypes = menu.hasSectionItems(SAMPLES_KEY);

    return (
        <Page title={title}>
            <Section
                title={title}
                caption={sampleTypeListingCaption}
                context={
                    <>
                        {isSampleStatusEnabled(moduleContext) && (
                            <RequiresPermission perms={PermissionTypes.Admin}>
                                <a href={AppURL.create('admin', 'settings').toHref()} className="right-spacing">
                                    Manage Sample Statuses
                                </a>
                            </RequiresPermission>
                        )}
                        {user.hasDesignSampleTypesPermission() && (
                            <Button bsStyle="success" href={NEW_SAMPLE_TYPE_HREF.toHref()}>
                                Create Sample Type
                            </Button>
                        )}
                    </>
                }
            >
                {hasSampleTypes && <SampleTypeSummary user={user} navigate={navigate} />}
                {!hasSampleTypes && <SampleTypeEmptyAlert />}
            </Section>
        </Page>
    );
});
