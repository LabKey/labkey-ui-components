import React, { FC, useMemo } from 'react';
import { List } from 'immutable';

import { capitalizeFirstChar, getEditorModel, QueryGridModel } from '../../..';

import { getCommonDataValues } from '../../util/utils';

import { QueryInfoForm, QueryInfoFormProps } from './QueryInfoForm';

interface Props extends Omit<QueryInfoFormProps, 'fieldValues' | 'queryInfo'> {
    model: QueryGridModel;
    selectedRowIndexes: List<number>;
}

export const BulkAddUpdateForm: FC<Props> = ({ model, selectedRowIndexes, ...queryInfoFormProps }) => {
    const {
        pluralNoun,
        singularNoun,
        submitForEditText = `Finish Editing ${capitalizeFirstChar(pluralNoun)}`,
        title = 'Update ' + selectedRowIndexes.size + ' ' + (selectedRowIndexes.size === 1 ? singularNoun : pluralNoun),
    } = queryInfoFormProps;

    const editorModel = getEditorModel(model.getId());

    const fieldValues = useMemo(() => {
        const editorData = editorModel
            .getRawData(model)
            .filter((val, index) => selectedRowIndexes.contains(index))
            .toMap();
        return getCommonDataValues(editorData);
    }, [editorModel, model, selectedRowIndexes]);

    return (
        <QueryInfoForm
            {...queryInfoFormProps}
            fieldValues={fieldValues}
            queryInfo={model.queryInfo.getInsertQueryInfo()}
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
