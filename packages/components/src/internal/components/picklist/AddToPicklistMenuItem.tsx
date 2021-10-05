import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { User } from '../base/models/User';
import { isSamplePicklistEnabled, userCanManagePicklists } from '../../app/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { ChoosePicklistModal } from './ChoosePicklistModal';
import { PicklistEditModal } from './PicklistEditModal';
import { isSampleOperationPermitted } from '../samples/utils';
import { SampleOperations } from '../samples/constants';
import { SampleOperationMenuItem } from '../samples/SampleOperationMenuItem';

interface Props {
    queryModel?: QueryModel;
    sampleIds?: string[];
    key?: string;
    itemText?: string;
    user: User;
    currentProductId?: string;
    picklistProductId?: string;
    metricFeatureArea?: string;
}

export const AddToPicklistMenuItem: FC<Props> = memo(props => {
    const {
        sampleIds,
        key,
        itemText,
        user,
        queryModel,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
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

    if (!userCanManagePicklists(user) || !isSamplePicklistEnabled()) {
        return null;
    }

    const useSelection = sampleIds == undefined;
    const id = queryModel?.id;
    const numSelected = sampleIds ? sampleIds.length : queryModel.selections?.size;

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
                <SampleOperationMenuItem
                    operationPermitted={isSampleOperationPermitted(queryModel.getRow(), SampleOperations.AddToPicklist)}
                    menuItemProps={{onClick: onClick, key: key}}
                    menuItemContent={itemText}
                />
            )}
            {showChoosePicklist && (
                <ChoosePicklistModal
                    onCancel={closeAddToPicklist}
                    afterAddToPicklist={afterAddToPicklist}
                    user={user}
                    selectionKey={id}
                    numSelected={numSelected}
                    sampleIds={sampleIds}
                    currentProductId={currentProductId}
                    picklistProductId={picklistProductId}
                    metricFeatureArea={metricFeatureArea}
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
                metricFeatureArea={metricFeatureArea}
            />
        </>
    );
});

AddToPicklistMenuItem.defaultProps = {
    itemText: 'Add to Picklist',
    key: 'add-to-picklist-menu-item',
};
