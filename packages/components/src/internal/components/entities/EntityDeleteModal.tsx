import React, { useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    capitalizeFirstChar,
    ConfirmModal,
    Progress,
    QueryGridModel,
    SchemaQuery,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteRows, QueryModel,
} from '../../..';

import { EntityDeleteConfirmModal } from './EntityDeleteConfirmModal';
import { EntityDataType } from './models';

interface Props {
    model: QueryGridModel | QueryModel;
    maxSelected?: number;
    useSelected: boolean;
    beforeDelete?: () => any;
    afterDelete: (rowsToKeep?: any[]) => any;
    onCancel: () => any;
    entityDataType: EntityDataType;
    auditBehavior?: AuditBehaviorTypes;
    verb?: string;
}

export const EntityDeleteModal: React.FC<Props> = props => {
    const {
        auditBehavior,
        model,
        onCancel,
        afterDelete,
        beforeDelete,
        useSelected,
        entityDataType,
        maxSelected,
    } = props;
    const { nounSingular, nounPlural } = entityDataType;
    const [showProgress, setShowProgress] = useState(false);
    const [numConfirmed, setNumConfirmed] = useState(0);
    const noun = ' ' + getNoun(numConfirmed);
    const isFiltered = model instanceof QueryGridModel ? model.isFiltered() : model.isFiltered;
    let rowIds;
    let numSelected = 0;
    if (useSelected) {
        if( model instanceof QueryGridModel ) {
            if (isFiltered) {
                rowIds = model.selectedIds.toArray();
                numSelected = rowIds.length;
            }
            else {
                numSelected = model.selectedQuantity;
            }
        }
        else {
            rowIds = model.selections ?? [];
            numSelected = rowIds.length
        }
    } else {
        if( model instanceof QueryGridModel ) {
            rowIds = [model.dataIds.get(0)];
        }
        else {
            rowIds = model.gridData[0]?.key
        }
        numSelected = 1;
    }

    function getNoun(quantity: number): string {
        return quantity === 1 ? nounSingular : nounPlural;
    }

    function onConfirm(rowsToDelete: any[], rowsToKeep: any[]): void {
        setNumConfirmed(rowsToDelete.length);
        setShowProgress(true);
        beforeDelete?.();
        const noun = ' ' + getNoun(rowsToDelete.length);

        const schema = model['schema'] ?? model['schemaName'];
        const query = model['query'] ?? model['queryName'];
        const schemaQuery = SchemaQuery.create(schema, query);

        deleteRows({
            schemaQuery,
            rows: rowsToDelete,
            auditBehavior,
        })
            .then(() => {
                afterDelete(rowsToKeep);
                createDeleteSuccessNotification(noun, rowsToDelete.length, undefined);
            })
            .catch(error => {
                setShowProgress(false);
                createDeleteErrorNotification(noun);
            });
    }

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={'Cannot Delete ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                msg={`You cannot delete more than ${maxSelected} individual ${nounPlural} at a time. Please select fewer ${nounPlural} and try again.`}
                onConfirm={undefined}
                cancelButtonText="Dismiss"
            />
        );
    }

    return (
        <>
            {!showProgress && (
                <EntityDeleteConfirmModal
                    selectionKey={useSelected && !isFiltered ? model.id : undefined}
                    rowIds={rowIds}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    entityDataType={entityDataType}
                    verb={props.verb}
                />
            )}
            <Progress
                modal={true}
                estimate={numConfirmed * 10}
                title={'Deleting ' + numConfirmed + noun}
                toggle={showProgress}
            />
        </>
    );
};
