import React, { FC, useCallback } from 'react';

import { userCanManagePicklists } from '../../app/utils';

import { User } from '../base/models/User';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { useModalState } from '../../hooks';
import { PicklistMenuItem } from './PicklistMenuItem';

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

    if (!userCanManagePicklists(user)) return null;

    return (
        <>
            {asMenuItem && <PicklistMenuItem itemText={itemText} open={open} selectedRowIds={selectedRowIds} />}
            {!asMenuItem && (
                <button className="btn btn-success" onClick={open} type="button">
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
