/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode, FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { AppURL } from '../internal/url/AppURL';
import { useServerContext } from '../internal/components/base/ServerContext';
import { Page } from '../internal/components/base/Page';
import { Section } from '../internal/components/base/Section';
import { isSampleStatusEnabled } from '../internal/app/utils';
import { RequiresPermission } from '../internal/components/base/Permissions';

import { SampleTypeEmptyAlert } from '../internal/components/samples/SampleEmptyAlert';

import { SampleTypeSummary } from './SampleTypeSummary';

interface Props {
    buttons: ReactNode;
    caption: string;
    excludedSampleTypes?: string[];
    hasSampleTypes: boolean;
    navigate: (url: string | AppURL) => void;
}

export const SampleTypePage: FC<Props> = memo(props => {
    const { caption, buttons, excludedSampleTypes, hasSampleTypes, navigate } = props;
    const { user } = useServerContext();
    const title = 'Sample Types';

    return (
        <Page title={title}>
            <Section
                title={title}
                caption={caption}
                context={
                    <>
                        {isSampleStatusEnabled() && (
                            <RequiresPermission perms={PermissionTypes.Admin}>
                                <a href={AppURL.create('admin', 'settings').toHref()} className="right-spacing">
                                    Manage Sample Statuses
                                </a>
                            </RequiresPermission>
                        )}
                        {buttons}
                    </>
                }
            >
                {hasSampleTypes && (
                    <SampleTypeSummary excludedSampleSets={excludedSampleTypes} navigate={navigate} user={user} />
                )}
                {!hasSampleTypes && <SampleTypeEmptyAlert user={user} />}
            </Section>
        </Page>
    );
});
