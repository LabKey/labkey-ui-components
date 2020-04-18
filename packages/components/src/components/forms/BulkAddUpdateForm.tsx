import React from 'react';
import { List } from 'immutable';

import { capitalizeFirstChar, getCommonDataValues } from '../../util/utils';
import { QueryInfo } from '../base/models/QueryInfo';
import { QueryColumn, QueryGridModel } from '../base/models/model';
import { getEditorModel } from '../../global';
import { EditorModel } from '../../models';

import { QueryInfoForm } from './QueryInfoForm';

interface Props {
    selectedRowIndexes: List<number>;
    singularNoun?: string;
    pluralNoun?: string;
    title?: string;
    columnFilter?: (col?: QueryColumn) => boolean;
    itemLabel?: string;
    model: QueryGridModel;
    onCancel: () => any;
    onError?: (message: string) => any;
    onComplete: (data: any, submitForEdit: boolean) => any;
    onSubmitForEdit: (updateData: any) => any;
}

export class BulkAddUpdateForm extends React.Component<Props, any> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
        itemLabel: 'table',
    };

    getEditorModel(): EditorModel {
        const { model } = this.props;
        return getEditorModel(model.getId());
    }

    getSelectionNoun(): string {
        const { singularNoun, pluralNoun, selectedRowIndexes } = this.props;
        return selectedRowIndexes.size === 1 ? singularNoun : pluralNoun;
    }

    getTitle(): string {
        const { title, selectedRowIndexes } = this.props;
        return title ? title : 'Update ' + selectedRowIndexes.size + ' ' + this.getSelectionNoun();
    }

    getInsertQueryInfo(): QueryInfo {
        const { model } = this.props;
        const updateColumns = model.queryInfo.columns.filter(column => column.shownInInsertView);
        return model.queryInfo.set('columns', updateColumns) as QueryInfo;
    }

    render() {
        const {
            pluralNoun,
            model,
            onCancel,
            onComplete,
            columnFilter,
            onSubmitForEdit,
            selectedRowIndexes,
        } = this.props;

        const editorModel = this.getEditorModel();
        const editorData = editorModel
            .getRawData(model)
            .filter((val, index) => {
                return selectedRowIndexes.contains(index);
            })
            .toMap();
        const fieldValues = getCommonDataValues(editorData);

        return (
            <QueryInfoForm
                allowFieldDisable={true}
                initiallyDisableFields={true}
                canSubmitForEdit={true}
                fieldValues={fieldValues}
                onSubmitForEdit={onSubmitForEdit}
                onSuccess={onComplete}
                asModal={true}
                includeCountField={false}
                checkRequiredFields={false}
                showLabelAsterisk={true}
                submitForEditText={`Finish Editing ${capitalizeFirstChar(pluralNoun)}`}
                columnFilter={columnFilter}
                onHide={onCancel}
                onCancel={onCancel}
                queryInfo={this.getInsertQueryInfo()}
                schemaQuery={model.queryInfo.schemaQuery}
                title={this.getTitle()}
            />
        );
    }
}
