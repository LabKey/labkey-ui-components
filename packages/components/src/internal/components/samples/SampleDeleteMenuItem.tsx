import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from "@labkey/api";

import { EntityDeleteModal, SampleTypeDataType, QueryModel, SelectionMenuItem } from "../../..";

interface Props {
    queryModel: QueryModel;
    key?: string;
    itemText?: string;
    verb?: string
    beforeSampleDelete?: () => any;
    afterSampleDelete?: (rowsToKeep?: any[]) => any;
    auditBehavior?: AuditBehaviorTypes;
    maxDeleteRows?: number;
}

export const SampleDeleteMenuItem: FC<Props> = memo(props => {
    const { key, itemText, queryModel, verb, beforeSampleDelete, afterSampleDelete, auditBehavior, maxDeleteRows } = props;
    const [showConfirmDeleteSamples, setShowConfirmDeleteSamples] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (!queryModel || queryModel.selections.size > 0) {
            setShowConfirmDeleteSamples(true);
        }
    }, [queryModel]);

    const onClose = useCallback(() => {
        setShowConfirmDeleteSamples(false);
    }, []);

    const onDeleteComplete = useCallback((rowsToKeep: Array<any>) => {
        setShowConfirmDeleteSamples(false);
        if (afterSampleDelete)
            afterSampleDelete(rowsToKeep);
    }, []);

    const useSelection = queryModel !== undefined;

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
            {showConfirmDeleteSamples && (
                <EntityDeleteModal
                    queryModel={queryModel}
                    useSelected={true}
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
    key: 'delete-samples-menu-item',
    verb: 'deleted and removed from storage',
    maxDeleteRows: 10000,
    auditBehavior: AuditBehaviorTypes.DETAILED
};
