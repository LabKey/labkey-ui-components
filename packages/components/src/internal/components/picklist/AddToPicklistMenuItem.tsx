import React, { FC, memo, useCallback } from 'react';

import { userCanManagePicklists } from '../../app/utils';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { User } from '../base/models/User';

import { PicklistEditModal } from './PicklistEditModal';
import { ChoosePicklistModal } from './ChoosePicklistModal';
import { MAX_SELECTIONS_MESSAGE, MAX_SELECTIONS_PER_ADD } from './constants';
import { useModalState } from '../../hooks';
import { SchemaQuery } from '../../../public/SchemaQuery';

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

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const disabled = !selectedRowIds || selectedRowIds.length === 0 || selectedRowIds.length > MAX_SELECTIONS_PER_ADD;
    let disabledMessage: string;

    if (!selectedRowIds || selectedRowIds.length === 0) {
        disabledMessage = 'Select one or more samples.';
    } else if (selectedRowIds.length > MAX_SELECTIONS_PER_ADD) {
        disabledMessage = MAX_SELECTIONS_MESSAGE;
    }

    return (
        <>
            <DisableableMenuItem disabled={disabled} disabledMessage={disabledMessage} onClick={openChoose} placement="right">
                Add to Picklist
            </DisableableMenuItem>

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
