import React, { FC, useMemo } from 'react';
import { List, Map } from 'immutable';

import { Operation } from '../../../public/QueryColumn';

import { capitalizeFirstChar, getCommonDataValues } from '../../util/utils';
import { EditorModel } from '../editable/models';

import { Alert } from '../base/Alert';

import { QueryInfoForm, QueryInfoFormProps } from './QueryInfoForm';

type BaseProps = Omit<
    QueryInfoFormProps,
    | 'allowFieldDisable'
    | 'checkRequiredFields'
    | 'fieldValues'
    | 'hideButtons'
    | 'includeCountField'
    | 'initiallyDisableFields'
    | 'showLabelAsterisk'
    | 'title'
>;

interface BulkAddUpdateFormProps extends BaseProps {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
    editorModel: EditorModel;
    operation: Operation;
    selectedRowIndexes: List<number>;
    warning?: string;
}

export const BulkAddUpdateForm: FC<BulkAddUpdateFormProps> = props => {
    const { data, dataKeys, editorModel, queryInfo, selectedRowIndexes, warning, ...queryInfoFormProps } = props;
    const {
        pluralNoun,
        singularNoun,
        submitForEditText = `Finish Editing ${capitalizeFirstChar(pluralNoun)}`,
    } = queryInfoFormProps;
    const title =
        'Update ' + selectedRowIndexes.size + ' ' + (selectedRowIndexes.size === 1 ? singularNoun : pluralNoun);

    const fieldValues = useMemo(() => {
        const editorData = editorModel
            .getRawDataFromGridData(data, dataKeys, queryInfo, false)
            .filter((val, index) => selectedRowIndexes.contains(index))
            .toMap();
        return getCommonDataValues(editorData);
    }, [data, dataKeys, editorModel, queryInfo, selectedRowIndexes]);

    return (
        <>
            <Alert bsStyle="warning">{warning}</Alert>
            <QueryInfoForm
                {...queryInfoFormProps}
                allowFieldDisable
                checkRequiredFields={false}
                fieldValues={fieldValues}
                hideButtons={!queryInfoFormProps.asModal}
                includeCountField={false}
                initiallyDisableFields={true}
                queryInfo={queryInfo.getInsertQueryInfo()}
                showLabelAsterisk
                submitForEditText={submitForEditText}
                title={title}
            />
        </>
    );
};

BulkAddUpdateForm.defaultProps = {
    asModal: true,
    pluralNoun: 'rows',
    singularNoun: 'row',
};

BulkAddUpdateForm.displayName = 'BulkAddUpdateForm';
