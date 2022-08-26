import React, { FC, useMemo } from 'react';
import { List, Map } from 'immutable';

import {capitalizeFirstChar, getCommonDataValues} from '../../util/utils';

import { QueryInfoForm, QueryInfoFormProps } from './QueryInfoForm';
import {EditorModel} from "../../models";

interface Props extends Omit<QueryInfoFormProps, 'fieldValues'> {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
    editorModel: EditorModel;
    selectedRowIndexes: List<number>;
}

export const BulkAddUpdateForm: FC<Props> = props => {
    const { data, dataKeys, editorModel, queryInfo, selectedRowIndexes, ...queryInfoFormProps } = props;
    const {
        pluralNoun,
        singularNoun,
        submitForEditText = `Finish Editing ${capitalizeFirstChar(pluralNoun)}`,
        title = 'Update ' + selectedRowIndexes.size + ' ' + (selectedRowIndexes.size === 1 ? singularNoun : pluralNoun),
    } = queryInfoFormProps;

    const fieldValues = useMemo(() => {
        const editorData = editorModel
            .getRawDataFromGridData(data, dataKeys, queryInfo, false)
            .filter((val, index) => selectedRowIndexes.contains(index))
            .toMap();
        return getCommonDataValues(editorData);
    }, [data, dataKeys, editorModel, queryInfo, selectedRowIndexes]);

    return (
        <QueryInfoForm
            {...queryInfoFormProps}
            fieldValues={fieldValues}
            queryInfo={queryInfo.getInsertQueryInfo()}
            submitForEditText={submitForEditText}
            title={title}
        />
    );
};

BulkAddUpdateForm.defaultProps = {
    allowFieldDisable: true,
    asModal: true,
    checkRequiredFields: false,
    includeCountField: false,
    initiallyDisableFields: true,
    pluralNoun: 'rows',
    showLabelAsterisk: true,
    singularNoun: 'row',
};

BulkAddUpdateForm.displayName = 'BulkAddUpdateForm';
