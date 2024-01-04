import React, { FC, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { userCanManagePicklists } from '../../app/utils';

import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { User } from '../base/models/User';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { MAX_SELECTIONS_PER_ADD } from './constants';

interface Props extends Omit<PicklistEditModalProps, 'onCancel' | 'onFinish' | 'showNotification'> {
    asMenuItem?: boolean;
    itemText?: string;
    onCreatePicklist?: () => void;
    user: User;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { asMenuItem, itemText, user, onCreatePicklist, queryModel, sampleIds, ...editModalProps } = props;
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

    return (
        <>
            {queryModel && (
                <SelectionMenuItem
                    id="create-picklist-menu-id"
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                    maxSelection={MAX_SELECTIONS_PER_ADD}
                />
            )}
            {!queryModel && asMenuItem && <MenuItem onClick={onClick}>{itemText}</MenuItem>}
            {!queryModel && !asMenuItem && (
                <button className="btn btn-success" onClick={onClick} type="button">
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

PicklistCreationMenuItem.defaultProps = {
    itemText: 'Create a New Picklist',
};

PicklistCreationMenuItem.displayName = 'PicklistCreationMenuItem';
