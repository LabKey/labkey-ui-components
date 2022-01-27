import React, { FC, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { userCanManagePicklists } from '../../app/utils';
import { User } from '../base/models/User';

import { PicklistEditModal } from './PicklistEditModal';
import { Picklist } from './models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

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
    onCreatePicklist?: () => void;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { key, itemText, user, onCreatePicklist } = props;
    const [showModal, setShowModal] = useState<boolean>(false);

    const onFinish = (picklist: Picklist) => {
        setShowModal(false);
        onCreatePicklist?.();
    };

    const onCancel = () => {
        setShowModal(false);
    };

    const onClick = () => {
        setShowModal(true);
    };

    if (!userCanManagePicklists(user)) {
        return null;
    }

    return (
        <>
            <MenuItem onClick={onClick} key={key}>
                {itemText}
            </MenuItem>
            {showModal && <PicklistEditModal {...props} showNotification onFinish={onFinish} onCancel={onCancel} />}
        </>
    );
};
