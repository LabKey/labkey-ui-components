/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';

import { userCanManagePicklists } from '../../app/utils';

import { User } from '../base/models/User';

import { PicklistEditModal } from './PicklistEditModal';
import { ChoosePicklistModal } from './ChoosePicklistModal';
import { useModalState } from '../../hooks';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { PicklistMenuItem } from './PicklistMenuItem';

interface Props {
    metricFeatureArea?: string;
    sampleFieldKey?: string;
    schemaQuery?: SchemaQuery;
    selectedRowIds?: number[] | string[] | undefined;
    user: User;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const { user, metricFeatureArea, sampleFieldKey, selectedRowIds, schemaQuery } = props;
    const { close: closeChoose, open: openChoose, show: showChoose } = useModalState();
    const { close: closeCreate, open: openCreate, show: showCreate } = useModalState();

    const closeAddToPicklist = useCallback(
        (closeToCreate?: boolean) => {
            closeChoose();
            if (closeToCreate) openCreate();
        },
        [closeChoose, openCreate]
    );

    if (!userCanManagePicklists(user)) return null;

    return (
        <>
            <PicklistMenuItem itemText="Add to Picklist" open={openChoose} selectedRowIds={selectedRowIds} />

            {showChoose && (
                <ChoosePicklistModal
                    afterAddToPicklist={closeChoose}
                    metricFeatureArea={metricFeatureArea}
                    onCancel={closeAddToPicklist}
                    sampleFieldKey={sampleFieldKey}
                    schemaQuery={schemaQuery}
                    selectedRowIds={selectedRowIds}
                    user={user}
                />
            )}
            {showCreate && (
                <PicklistEditModal
                    metricFeatureArea={metricFeatureArea}
                    onCancel={closeCreate}
                    onFinish={closeCreate}
                    sampleFieldKey={sampleFieldKey}
                    schemaQuery={schemaQuery}
                    selectedRowIds={selectedRowIds}
                    showNotification
                />
            )}
        </>
    );
});
AddToPicklistMenuItem.displayName = 'AddToPicklistMenuItem';
