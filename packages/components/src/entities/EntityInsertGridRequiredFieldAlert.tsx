import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';

import { QueryInfo } from '../public/QueryInfo';
import { QueryColumn } from '../public/QueryColumn';
import { Alert } from '../internal/components/base/Alert';

interface Props {
    queryInfo: QueryInfo;
    type: string;
}

export const EntityInsertGridRequiredFieldAlert: FC<Props> = memo(props => {
    const { type, queryInfo } = props;

    const allRequiredCols = useMemo(() => {
        if (!queryInfo || queryInfo.isLoading) return [];

        return getFieldKeysOfRequiredCols(queryInfo.getAllColumns());
    }, [queryInfo]);

    const insertRequiredCols = useMemo(() => {
        if (!queryInfo || queryInfo.isLoading) return [];

        return getFieldKeysOfRequiredCols(queryInfo.getInsertColumns());
    }, [queryInfo]);

    const missingReqColLabels = useMemo(() => {
        return allRequiredCols
            .filter(fieldKey => insertRequiredCols.indexOf(fieldKey) === -1)
            .map(fieldKey => queryInfo.getColumn(fieldKey).caption);
    }, [queryInfo, allRequiredCols, insertRequiredCols]);

    if (missingReqColLabels.length === 0) {
        return null;
    }

    return (
        <Alert bsStyle="warning">
            <b>Warning: </b> the selected {type} has required fields that are not included in the grid below:{' '}
            {missingReqColLabels.join(', ')}.
        </Alert>
    );
});

// exported for jest testing
export function getFieldKeysOfRequiredCols(cols: QueryColumn[]): string[] {
    return cols
        .filter(col => col.isEditable() && col.required && col.fieldKeyArray.length === 1)
        .map(col => col.fieldKey);
}
