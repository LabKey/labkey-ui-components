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
import { MAX_SELECTIONS_MESSAGE, MAX_SELECTIONS_PER_ADD } from './constants';

interface Props {
    metricFeatureArea?: string;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
    sampleIds?: number[];
    user: User;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const { sampleIds, user, queryModel, metricFeatureArea, sampleFieldKey } = props;
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
    const operationPermitted = isSampleOperationPermitted(
        getSampleStatusType(queryModel.getRow()),
        SampleOperation.AddToPicklist
    );
    return (
        <>
            {useSelection ? (
                <SelectionMenuItem
                    maxSelection={MAX_SELECTIONS_PER_ADD}
                    nounPlural="samples"
                    onClick={onClick}
                    queryModel={queryModel}
                    text="Add to Picklist"
                />
            ) : (
                <DisableableMenuItem
                    disabled={!operationPermitted || numSelected > MAX_SELECTIONS_PER_ADD}
                    disabledMessage={numSelected > MAX_SELECTIONS_PER_ADD ? MAX_SELECTIONS_MESSAGE : undefined}
                    onClick={onClick}
                >
                    Add to Picklist
                </DisableableMenuItem>
            )}
            {showChoosePicklist && (
                <ChoosePicklistModal
                    afterAddToPicklist={afterAddToPicklist}
                    metricFeatureArea={metricFeatureArea}
                    numSelected={numSelected}
                    onCancel={closeAddToPicklist}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                    sampleIds={sampleIds}
                    selectionKey={selectionKey}
                    user={user}
                />
            )}
            {showCreatePicklist && (
                <PicklistEditModal
                    metricFeatureArea={metricFeatureArea}
                    onCancel={closeCreatePicklist}
                    onFinish={afterCreatePicklist}
                    queryModel={queryModel}
                    sampleFieldKey={sampleFieldKey}
                    sampleIds={sampleIds}
                    showNotification
                />
            )}
        </>
    );
});
AddToPicklistMenuItem.displayName = 'AddToPicklistMenuItem';
