import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { EntityDeleteModal } from './EntityDeleteModal';
import { SampleTypeDataType } from '../internal/components/entities/constants';

import { MAX_SELECTED_SAMPLES } from '../internal/components/samples/constants';

interface Props {
    afterSampleDelete?: (rowsToKeep?: any[]) => void;
    api?: ComponentsAPIWrapper;
    auditBehavior?: AuditBehaviorTypes;
    beforeSampleDelete?: () => void;
    handleClick?: (cb: () => void, errorMsg?: string) => void;
    itemText?: string;
    maxDeleteRows?: number;
    metricFeatureArea?: string;
    queryModel: QueryModel;
    selectionMenuId?: string;
    verb?: string;
}

export const SampleDeleteMenuItem: FC<Props> = memo(props => {
    const {
        itemText,
        queryModel,
        verb,
        beforeSampleDelete,
        afterSampleDelete,
        auditBehavior,
        maxDeleteRows,
        selectionMenuId,
        metricFeatureArea,
        api,
        handleClick,
    } = props;
    const [showConfirmDeleteSamples, setShowConfirmDeleteSamples] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (!queryModel || queryModel.hasSelections) {
            if (handleClick) handleClick(() => setShowConfirmDeleteSamples(true), 'Cannot Delete Samples');
            else setShowConfirmDeleteSamples(true);
        }
    }, [handleClick, queryModel]);

    const onClose = useCallback(() => {
        setShowConfirmDeleteSamples(false);
    }, []);

    const onDeleteComplete = useCallback(
        (rowsToKeep: any[]) => {
            setShowConfirmDeleteSamples(false);
            afterSampleDelete?.(rowsToKeep);
            api.query.incrementClientSideMetricCount(metricFeatureArea, 'deleteSamples');
        },
        [afterSampleDelete, api, metricFeatureArea]
    );

    return (
        <>
            {queryModel !== undefined ? (
                <SelectionMenuItem
                    id={selectionMenuId}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural="samples"
                />
            ) : (
                <MenuItem onClick={onClick} key={selectionMenuId}>
                    {itemText}
                </MenuItem>
            )}
            {showConfirmDeleteSamples && (
                <EntityDeleteModal
                    queryModel={queryModel}
                    useSelected
                    beforeDelete={beforeSampleDelete}
                    afterDelete={onDeleteComplete}
                    onCancel={onClose}
                    maxSelected={maxDeleteRows}
                    entityDataType={SampleTypeDataType}
                    auditBehavior={auditBehavior}
                    verb={verb}
                />
            )}
        </>
    );
});

SampleDeleteMenuItem.defaultProps = {
    api: getDefaultAPIWrapper(),
    auditBehavior: AuditBehaviorTypes.DETAILED,
    itemText: 'Delete',
    maxDeleteRows: MAX_SELECTED_SAMPLES,
    selectionMenuId: 'delete-samples-menu-item',
    verb: 'deleted and removed from storage',
};
