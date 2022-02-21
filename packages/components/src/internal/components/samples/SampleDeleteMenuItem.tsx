import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { EntityDeleteModal, SampleTypeDataType, QueryModel, SelectionMenuItem } from '../../..';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { MAX_SELECTED_SAMPLES } from './constants';

interface Props {
    api?: ComponentsAPIWrapper;
    queryModel: QueryModel;
    key?: string;
    itemText?: string;
    verb?: string;
    beforeSampleDelete?: () => any;
    afterSampleDelete?: (rowsToKeep?: any[]) => any;
    auditBehavior?: AuditBehaviorTypes;
    maxDeleteRows?: number;
    metricFeatureArea?: string;
}

export const SampleDeleteMenuItem: FC<Props> = memo(props => {
    const {
        key,
        itemText,
        queryModel,
        verb,
        beforeSampleDelete,
        afterSampleDelete,
        auditBehavior,
        maxDeleteRows,
        metricFeatureArea,
        api,
    } = props;
    const [showConfirmDeleteSamples, setShowConfirmDeleteSamples] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (!queryModel || queryModel.hasSelections) {
            setShowConfirmDeleteSamples(true);
        }
    }, [queryModel]);

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
    itemText: 'Delete Samples',
    key: 'delete-samples-menu-item',
    verb: 'deleted and removed from storage',
    maxDeleteRows: MAX_SELECTED_SAMPLES,
    auditBehavior: AuditBehaviorTypes.DETAILED,
};
