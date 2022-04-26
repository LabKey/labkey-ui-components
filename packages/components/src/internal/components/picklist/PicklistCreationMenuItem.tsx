import React, { FC, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { userCanManagePicklists } from '../../app/utils';
import { User } from '../base/models/User';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

interface Props extends Omit<PicklistEditModalProps, 'onCancel' | 'onFinish' | 'showNotification'> {
    itemText?: string;
    onCreatePicklist?: () => void;
    user: User;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { itemText, user, onCreatePicklist, queryModel, sampleIds, ...editModalProps } = props;
    const [showModal, setShowModal] = useState<boolean>(false);

    const onFinish = useCallback(() => {
        setShowModal(false);
        onCreatePicklist?.();
    }, [onCreatePicklist]);

    const onCancel = useCallback(() => {
        setShowModal(false);
    }, []);

    const onClick = useCallback(() => {
        if (queryModel?.hasSelections || sampleIds?.length) {
            setShowModal(true);
        }
    }, [queryModel, sampleIds]);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    return (
        <>
            {queryModel && (
                <SelectionMenuItem
                    id={'create-picklist-menu-id'}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                />
            )}
            {!queryModel && (<MenuItem onClick={onClick}>{itemText}</MenuItem>)}
            {showModal && (
                <PicklistEditModal queryModel={queryModel} sampleIds={sampleIds} {...editModalProps} showNotification onFinish={onFinish} onCancel={onCancel} />
            )}
        </>
    );
};

PicklistCreationMenuItem.defaultProps = {
    itemText: 'Create a New Picklist',
};

PicklistCreationMenuItem.displayName = 'PicklistCreationMenuItem';
