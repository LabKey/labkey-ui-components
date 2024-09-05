import React, { FC, useCallback, useState } from 'react';

import { userCanManagePicklists } from '../../app/utils';

import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { User } from '../base/models/User';

import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { MAX_SELECTIONS_MESSAGE, MAX_SELECTIONS_PER_ADD } from './constants';

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
        user,
        onCreatePicklist,
        queryModel,
        sampleIds,
        ...editModalProps
    } = props;
    const [showModal, setShowModal] = useState<boolean>(false);

    const onFinish = useCallback(() => {
        setShowModal(false);
        onCreatePicklist?.();
    }, [onCreatePicklist]);

    const onCancel = useCallback(() => {
        setShowModal(false);
    }, []);

    const onClick = useCallback(() => {
        setShowModal(true);
    }, []);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const numSamples = sampleIds?.length ?? queryModel?.selections?.size ?? 0;
    const excessSamples = numSamples > MAX_SELECTIONS_PER_ADD;

    return (
        <>
            {queryModel && (
                <SelectionMenuItem
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                    maxSelection={MAX_SELECTIONS_PER_ADD}
                />
            )}
            {!queryModel && asMenuItem && (
                <DisableableMenuItem
                    onClick={onClick}
                    disabled={excessSamples}
                    disabledMessage={MAX_SELECTIONS_MESSAGE}
                >
                    {itemText}
                </DisableableMenuItem>
            )}
            {!queryModel && !asMenuItem && (
                <button
                    disabled={excessSamples}
                    title={excessSamples ? MAX_SELECTIONS_MESSAGE : undefined}
                    className="btn btn-success"
                    onClick={onClick}
                    type="button"
                >
                    {itemText}
                </button>
            )}
            {showModal && (
                <PicklistEditModal
                    queryModel={queryModel}
                    sampleIds={sampleIds}
                    {...editModalProps}
                    showNotification
                    onFinish={onFinish}
                    onCancel={onCancel}
                />
            )}
        </>
    );
};

PicklistCreationMenuItem.displayName = 'PicklistCreationMenuItem';
