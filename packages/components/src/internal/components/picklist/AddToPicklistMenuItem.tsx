import React, { FC, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PicklistEditModal } from './PicklistEditModal';
import { ChoosePicklistModal } from './ChoosePicklistModal';
import { User } from '../base/models/User';
import { isSamplePicklistEnabled, userCanManagePicklists } from '../../app/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

interface Props {
    queryModel?: QueryModel;
    sampleIds?: string[];
    key?: string;
    itemText?: string;
    user: User;
}

export const AddToPicklistMenuItem: FC<Props> = props => {
    const {sampleIds, key, itemText, user, queryModel} = props;
    const [showChoosePicklist, setShowChoosePicklist] = useState<boolean>(false);
    const [showCreatePicklist, setShowCreatePicklist] = useState<boolean>(false);

    const closeAddToPicklist = (closeToCreate?: boolean) => {
        setShowChoosePicklist(false);
        if (closeToCreate) {
            setShowCreatePicklist(true);
        }
    };

    const afterAddToPicklist = () => {
        setShowChoosePicklist(false);
    };

    const closeCreatePicklist = () => {
        setShowCreatePicklist(false);
    };

    const afterCreatePicklist = () => {
        setShowCreatePicklist(false);
    };

    const onClick = () => {
        if (!queryModel || queryModel.selections.size > 0) {
            setShowChoosePicklist(true);
        }
    };

    if (!userCanManagePicklists(user) || !isSamplePicklistEnabled()) {
        return null;
    }

    const useSelection = queryModel !== undefined;
    const id = queryModel?.id;
    const numSelected = queryModel ? queryModel.selections?.size : sampleIds?.length;

    return (
        <>
            {useSelection ?
                <SelectionMenuItem
                    id={key}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural={'samples'}
                />
                :
                <MenuItem onClick={onClick} key={key}>
                    {itemText}
                </MenuItem>
            }
            {showChoosePicklist &&
            <ChoosePicklistModal
                onCancel={closeAddToPicklist}
                afterAddToPicklist={afterAddToPicklist}
                user={user}
                selectionKey={id}
                numSelected={numSelected}
                sampleIds={sampleIds}
            />
            }
            <PicklistEditModal
                selectionKey={id}
                selectedQuantity={numSelected}
                sampleIds={sampleIds}
                show={showCreatePicklist}
                onFinish={afterCreatePicklist}
                onCancel={closeCreatePicklist}
            />
        </>
    );
};

AddToPicklistMenuItem.defaultProps = {
    itemText: 'Add to Picklist',
    key: 'add-to-picklist-menu-item'
};
