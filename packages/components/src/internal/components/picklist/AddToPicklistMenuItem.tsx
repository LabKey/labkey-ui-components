import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { User } from '../base/models/User';
import { isSamplePicklistEnabled, userCanManagePicklists } from '../../app/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { ChoosePicklistModal } from './ChoosePicklistModal';
import { PicklistEditModal } from './PicklistEditModal';

interface Props {
    queryModel?: QueryModel;
    sampleIds?: string[];
    key?: string;
    itemText?: string;
    user: User;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const {sampleIds, key, itemText, user, queryModel} = props;
    const [showChoosePicklist, setShowChoosePicklist] = useState<boolean>(false);
    const [showCreatePicklist, setShowCreatePicklist] = useState<boolean>(false);

    const closeAddToPicklist = useCallback(
        (closeToCreate?: boolean) => {
            setShowChoosePicklist(false);
            if (closeToCreate) {
                setShowCreatePicklist(true);
            }
        },
        [setShowChoosePicklist]
    );

    const afterAddToPicklist = useCallback(() => {
        setShowChoosePicklist(false);
    }, [setShowChoosePicklist]);

    const closeCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, [setShowCreatePicklist]);

    const afterCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, [setShowCreatePicklist]);

    const onClick = useCallback(() => {
        if (!queryModel || queryModel.selections.size > 0) {
            setShowChoosePicklist(true);
        }
    }, [queryModel]);

    if (!userCanManagePicklists(user) || !isSamplePicklistEnabled()) {
        return null;
    }

    const useSelection = queryModel !== undefined;
    const id = queryModel?.id;
    const numSelected = queryModel ? queryModel.selections?.size : sampleIds?.length;

    return (
        <>
            {useSelection ? (
                <SelectionMenuItem
                    id={key}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                />
            ) : (
                <MenuItem onClick={onClick} key={key}>
                    {itemText}
                </MenuItem>
            )}
            {showChoosePicklist && (
                <ChoosePicklistModal
                    onCancel={closeAddToPicklist}
                    afterAddToPicklist={afterAddToPicklist}
                    user={user}
                    selectionKey={id}
                    numSelected={numSelected}
                    sampleIds={sampleIds}
                />
            )}
            <PicklistEditModal
                selectionKey={id}
                selectedQuantity={numSelected}
                sampleIds={sampleIds}
                show={showCreatePicklist}
                onFinish={afterCreatePicklist}
                onCancel={closeCreatePicklist}
                showNotification={true}
            />
        </>
    );
});

AddToPicklistMenuItem.defaultProps = {
    itemText: 'Add to Picklist',
    key: 'add-to-picklist-menu-item',
};
