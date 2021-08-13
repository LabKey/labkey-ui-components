import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';
import { Alert } from '../base/Alert';

interface Props {
    type: string;
    queryInfo: QueryInfo;
}

export const EntityInsertGridRequiredFieldAlert: FC<Props> = memo(props => {
    const { type, queryInfo } = props;
    if (!queryInfo || queryInfo.isLoading) {
        return null;
    }

    const allRequiredCols = useMemo(() => getFieldKeysOfRequiredCols(queryInfo.getAllColumns()), [queryInfo]);
    const insertRequiredCols = useMemo(() => getFieldKeysOfRequiredCols(queryInfo.getInsertColumns()), [queryInfo]);
    if (allRequiredCols.length === insertRequiredCols.length) {
        return null;
    }

    const missingReqColLabels = useMemo(() => {
        return allRequiredCols
            .filter(fieldKey => insertRequiredCols.indexOf(fieldKey) === -1)
            .map(fieldKey => queryInfo.getColumn(fieldKey).caption);
    }, [queryInfo]);

    return (
        <Alert bsStyle="warning">
            <b>Warning: </b> the selected {type} has required fields which are not included in the grid below:{' '}
            {missingReqColLabels.join(', ')}.
        </Alert>
    );
});

function getFieldKeysOfRequiredCols(cols: List<QueryColumn>): string[] {
    return cols
        .filter(col => col.isEditable() && col.required)
        .map(col => col.fieldKey)
        .toArray();
}
