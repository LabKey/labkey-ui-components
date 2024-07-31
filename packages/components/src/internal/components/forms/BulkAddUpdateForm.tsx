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
    editorModel: EditorModel;
    operation: Operation;
    selectedRowIndexes: List<number>;
    warning?: string;
}

export const BulkAddUpdateForm: FC<BulkAddUpdateFormProps> = props => {
    const { editorModel, queryInfo, selectedRowIndexes, warning, ...queryInfoFormProps } = props;
    const {
        pluralNoun = 'rows',
        singularNoun = 'row',
        asModal = true,
        submitForEditText = `Finish Editing ${capitalizeFirstChar(pluralNoun)}`,
    } = queryInfoFormProps;
    const title =
        'Update ' + selectedRowIndexes.size + ' ' + (selectedRowIndexes.size === 1 ? singularNoun : pluralNoun);

    const fieldValues = useMemo(() => {
        const editorData = editorModel
            .getDataForServerUpload(false)
            .filter((val, index) => selectedRowIndexes.contains(index))
            .toMap();
        return getCommonDataValues(editorData);
    }, [editorModel, selectedRowIndexes]);

    return (
        <>
            <Alert bsStyle="warning">{warning}</Alert>
            <QueryInfoForm
                {...queryInfoFormProps}
                allowFieldDisable
                asModal={asModal}
                checkRequiredFields={false}
                fieldValues={fieldValues}
                hideButtons={!queryInfoFormProps.asModal}
                includeCountField={false}
                initiallyDisableFields={true}
                pluralNoun={pluralNoun}
                queryInfo={queryInfo.getInsertQueryInfo()}
                showLabelAsterisk
                singularNoun={singularNoun}
                submitForEditText={submitForEditText}
                title={title}
            />
        </>
    );
};

BulkAddUpdateForm.displayName = 'BulkAddUpdateForm';
