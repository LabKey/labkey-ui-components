import React, { FC, useState } from 'react';

import { MenuItem } from 'react-bootstrap';

import { isSamplePicklistEnabled, userCanManagePicklists } from '../../app/utils';

import { User } from '../base/models/User';

import { PicklistEditModal } from './PicklistEditModal';

import { Picklist } from './models';

interface Props {
    selectionKey?: string;
    selectedQuantity?: number;
    sampleIds?: string[];
    key: string;
    itemText: string;
    user: User;
    currentProductId?: string;
    picklistProductId?: string;
    metricFeatureArea?: string;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { key, itemText, user } = props;
    const [showModal, setShowModal] = useState<boolean>(false);

    const onFinish = (picklist: Picklist) => {
        setShowModal(false);
    };

    const onCancel = () => {
        setShowModal(false);
    };

    const onClick = () => {
        setShowModal(true);
    };

    if (!userCanManagePicklists(user) || !isSamplePicklistEnabled()) {
        return null;
    }

    return (
        <>
            <MenuItem onClick={onClick} key={key}>
                {itemText}
            </MenuItem>
            <PicklistEditModal
                {...props}
                showNotification={true}
                show={showModal}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        </>
    );
};
