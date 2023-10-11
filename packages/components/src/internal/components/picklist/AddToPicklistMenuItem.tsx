import React, { FC, memo, useCallback, useState } from 'react';

import { userCanManagePicklists } from '../../app/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { getSampleStatusType, isSampleOperationPermitted } from '../samples/utils';
import { SampleOperation } from '../samples/constants';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { User } from '../base/models/User';

import { PicklistEditModal } from './PicklistEditModal';
import { ChoosePicklistModal } from './ChoosePicklistModal';
import { MAX_SELECTIONS_PER_ADD } from './constants';

interface Props {
    currentProductId?: string;
    itemText?: string;
    metricFeatureArea?: string;
    picklistProductId?: string;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
    sampleIds?: string[];
    selectionMenuId?: string;
    user: User;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const {
        sampleIds,
        selectionMenuId,
        itemText,
        user,
        queryModel,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
        sampleFieldKey,
    } = props;
    const [showChoosePicklist, setShowChoosePicklist] = useState<boolean>(false);
    const [showCreatePicklist, setShowCreatePicklist] = useState<boolean>(false);

    const closeAddToPicklist = useCallback((closeToCreate?: boolean) => {
        setShowChoosePicklist(false);
        if (closeToCreate) {
            setShowCreatePicklist(true);
        }
    }, []);

    const afterAddToPicklist = useCallback(() => {
        setShowChoosePicklist(false);
    }, []);

    const closeCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, []);

    const afterCreatePicklist = useCallback(() => {
        setShowCreatePicklist(false);
    }, []);

    const onClick = useCallback(() => {
        if (queryModel?.hasSelections || sampleIds?.length) {
            setShowChoosePicklist(true);
        }
    }, [queryModel, sampleIds]);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const useSelection = sampleIds === undefined;
    const selectionKey = sampleIds ? undefined : queryModel?.selectionKey;
    const numSelected = sampleIds ? sampleIds.length : queryModel.selections?.size;

    return (
        <>
            {useSelection ? (
                <SelectionMenuItem
                    id={selectionMenuId}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    maxSelection={MAX_SELECTIONS_PER_ADD}
                    nounPlural="samples"
                />
            ) : (
                <DisableableMenuItem
                    onClick={onClick}
                    operationPermitted={isSampleOperationPermitted(
                        getSampleStatusType(queryModel.getRow()),
                        SampleOperation.AddToPicklist
                    )}
                >
                    {itemText}
                </DisableableMenuItem>
            )}
            {showChoosePicklist && (
                <ChoosePicklistModal
                    onCancel={closeAddToPicklist}
                    afterAddToPicklist={afterAddToPicklist}
                    user={user}
                    selectionKey={selectionKey}
                    numSelected={numSelected}
                    sampleIds={sampleIds}
                    currentProductId={currentProductId}
                    picklistProductId={picklistProductId}
                    metricFeatureArea={metricFeatureArea}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                />
            )}
            {showCreatePicklist && (
                <PicklistEditModal
                    sampleIds={sampleIds}
                    onFinish={afterCreatePicklist}
                    onCancel={closeCreatePicklist}
                    showNotification
                    metricFeatureArea={metricFeatureArea}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                />
            )}
        </>
    );
});

AddToPicklistMenuItem.defaultProps = {
    itemText: 'Add to Picklist',
    selectionMenuId: 'add-to-picklist-menu-item',
};
