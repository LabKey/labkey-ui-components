import React, { FC, useCallback } from 'react';

import { userCanManagePicklists } from '../../app/utils';

import { User } from '../base/models/User';

import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { MAX_SELECTIONS_MESSAGE, MAX_SELECTIONS_PER_ADD } from './constants';
import { useModalState } from '../../hooks';

interface Props extends Omit<PicklistEditModalProps, 'onCancel' | 'onFinish' | 'showNotification'> {
    asMenuItem?: boolean;
    itemText?: string;
    onCreatePicklist?: () => void;
    user: User;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const {
        asMenuItem,
        itemText = 'Create a New Picklist',
        metricFeatureArea,
        onCreatePicklist,
        sampleFieldKey,
        schemaQuery,
        selectedRowIds,
        user,
    } = props;
    const { close, open, show } = useModalState();
    const onFinish = useCallback(() => {
        close();
        onCreatePicklist?.();
    }, [close, onCreatePicklist]);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const numSamples = selectedRowIds?.length ?? 0;
    const excessSamples = numSamples > MAX_SELECTIONS_PER_ADD;

    return (
        <>
            {asMenuItem && (
                <DisableableMenuItem disabled={excessSamples} disabledMessage={MAX_SELECTIONS_MESSAGE} onClick={open}>
                    {itemText}
                </DisableableMenuItem>
            )}
            {!asMenuItem && (
                <button
                    className="btn btn-success"
                    disabled={excessSamples}
                    onClick={open}
                    title={excessSamples ? MAX_SELECTIONS_MESSAGE : undefined}
                    type="button"
                >
                    {itemText}
                </button>
            )}
            {show && (
                <PicklistEditModal
                    metricFeatureArea={metricFeatureArea}
                    onCancel={close}
                    onFinish={onFinish}
                    sampleFieldKey={sampleFieldKey}
                    schemaQuery={schemaQuery}
                    selectedRowIds={selectedRowIds}
                    showNotification
                />
            )}
        </>
    );
};

PicklistCreationMenuItem.displayName = 'PicklistCreationMenuItem';
