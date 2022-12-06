/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { Button, MenuItem } from 'react-bootstrap';

import { AppURL } from '../internal/url/AppURL';
import { useServerContext } from '../internal/components/base/ServerContext';
import { Page } from '../internal/components/base/Page';
import { Section } from '../internal/components/base/Section';
import { isSampleStatusEnabled } from '../internal/app/utils';

import { SampleTypeEmptyAlert } from '../internal/components/samples/SampleEmptyAlert';

import { NEW_SAMPLE_TYPE_HREF, SAMPLES_KEY } from '../internal/app/constants';
import { CommonPageProps } from '../internal/models';
import { LoadingPage } from '../internal/components/base/LoadingPage';

import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

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
    const showManageBtn = isSampleStatusEnabled(moduleContext) && user.hasAdminPermission();

    return (
        <Page title={title}>
            <Section
                title={title}
                caption={sampleTypeListingCaption}
                context={
                    <>
                        {user.hasDesignSampleTypesPermission() && (
                            <Button
                                bsStyle="success"
                                className={showManageBtn ? 'button-right-spacing' : ''}
                                href={NEW_SAMPLE_TYPE_HREF.toHref()}
                            >
                                Create Sample Type
                            </Button>
                        )}
                        {showManageBtn && (
                            <ManageDropdownButton id="sampletype-manage-menu" collapsed pullRight>
                                <MenuItem href={AppURL.create('admin', 'settings').toHref()}>Sample Statuses</MenuItem>
                            </ManageDropdownButton>
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
