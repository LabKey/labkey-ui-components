import React, { FC, useCallback, useState } from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { userCanManagePicklists } from '../../app/utils';

import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { useServerContext } from '../base/ServerContext';

interface Props extends Omit<PicklistEditModalProps, 'onCancel' | 'onFinish' | 'showNotification'> {
    itemText?: string;
    asMenuItem?: boolean;
    onCreatePicklist?: () => void;
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { asMenuItem, itemText, onCreatePicklist, queryModel, sampleIds, ...editModalProps } = props;
    const [showModal, setShowModal] = useState<boolean>(false);
    const { user } = useServerContext();

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
                />
            )}
            {!queryModel && asMenuItem && <MenuItem onClick={onClick}>{itemText}</MenuItem>}
            {!queryModel && !asMenuItem && <Button bsStyle="success" onClick={onClick}>{itemText}</Button>}
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
