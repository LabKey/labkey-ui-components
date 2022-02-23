import React, { FC, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { userCanManagePicklists } from '../../app/utils';
import { User } from '../base/models/User';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';

interface Props extends Omit<PicklistEditModalProps, 'onCancel' | 'onFinish' | 'showNotification'> {
    itemText: string;
    onCreatePicklist?: () => void;
    user: User;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { itemText, user, onCreatePicklist, ...editModalProps } = props;
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
            <MenuItem onClick={onClick}>{itemText}</MenuItem>
            {showModal && (
                <PicklistEditModal {...editModalProps} showNotification onFinish={onFinish} onCancel={onCancel} />
            )}
        </>
    );
};

PicklistCreationMenuItem.displayName = 'PicklistCreationMenuItem';
