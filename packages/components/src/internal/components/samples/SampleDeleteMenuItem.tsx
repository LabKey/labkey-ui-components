import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { EntityDeleteModal, SampleTypeDataType, QueryModel, SelectionMenuItem } from '../../..';

import { MAX_SELECTED_SAMPLES } from './constants';

interface Props {
    queryModel: QueryModel;
    itemText?: string;
    verb?: string;
    beforeSampleDelete?: () => any;
    afterSampleDelete?: (rowsToKeep?: any[]) => any;
    auditBehavior?: AuditBehaviorTypes;
    maxDeleteRows?: number;
    selectionMenuId?: string;
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

    const onDeleteComplete = useCallback((rowsToKeep: any[]) => {
        setShowConfirmDeleteSamples(false);
        afterSampleDelete?.(rowsToKeep);
    }, []);

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
    itemText: 'Delete Samples',
    verb: 'deleted and removed from storage',
    maxDeleteRows: MAX_SELECTED_SAMPLES,
    auditBehavior: AuditBehaviorTypes.DETAILED,
    selectionMenuId: 'delete-samples-menu-item',
};
