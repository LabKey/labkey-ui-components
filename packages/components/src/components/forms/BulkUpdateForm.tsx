import React from 'react';
import { List, Map } from 'immutable';
import { Utils } from '@labkey/api';

import { getSelectedDataWithQueryGridModel } from '../../actions';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { capitalizeFirstChar, getCommonDataValues, getUpdatedData } from '../../util/utils';
import { QueryInfo } from '../base/models/QueryInfo';
import { QueryColumn, QueryGridModel, SchemaQuery } from '../base/models/model';

import { QueryInfoForm } from './QueryInfoForm';

interface Props {
    singularNoun?: string;
    pluralNoun?: string;
    uniqueFieldKey?: string;
    itemLabel?: string;
    model: QueryGridModel;
    canSubmitForEdit: boolean;
    onCancel: () => any;
    onError?: (message: string) => any;
    onComplete: (data: any, submitForEdit: boolean) => any;
    onSubmitForEdit: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
    shownInUpdateColumns?: boolean;
}

interface State {
    isLoadingDataForSelection: boolean;
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    errorMsg: string;
}

export class BulkUpdateForm extends React.Component<Props, State> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
        itemLabel: 'table',
    };

    constructor(props) {
        super(props);

        this.state = {
            isLoadingDataForSelection: true,
            dataForSelection: undefined,
            dataIdsForSelection: undefined,
            errorMsg: undefined,
        };
    }

    componentWillMount() {
        const { model, onCancel, pluralNoun, shownInUpdateColumns } = this.props;

        // Get all shownInUpdateView columns or undefined
        const columns = shownInUpdateColumns
            ? (model.getKeyColumns().concat(model.getUpdateColumns()) as List<QueryColumn>)
            : undefined;

        getSelectedDataWithQueryGridModel(model, columns)
            .then(response => {
                const { data, dataIds } = response;
                this.setState(() => ({
                    isLoadingDataForSelection: false,
                    dataForSelection: data,
                    dataIdsForSelection: dataIds,
                }));
            })
            .catch(reason => {
                console.error(reason);
                if (this.props.onError) {
                    this.props.onError('There was a problem loading the data for the selected ' + pluralNoun + '.');
                }
                onCancel();
            });
    }

    getSelectionCount(): number {
        return this.props.model.selectedIds.size;
    }

    getSelectionNoun(): string {
        const { singularNoun, pluralNoun } = this.props;
        return this.getSelectionCount() === 1 ? singularNoun : pluralNoun;
    }

    getTitle(): string {
        const prefix = 'Update ' + this.getSelectionCount() + ' ' + this.getSelectionNoun();
        return prefix + " selected from '" + this.props.itemLabel + "'";
    }

    getUpdateQueryInfo(): QueryInfo {
        const { model, uniqueFieldKey } = this.props;
        const lcUniqueFieldKey = uniqueFieldKey ? uniqueFieldKey.toLowerCase() : undefined;
        const updateColumns = model.queryInfo.columns.filter(
            column => column.shownInUpdateView && (!lcUniqueFieldKey || column.name.toLowerCase() !== lcUniqueFieldKey)
        );
        return model.queryInfo.set('columns', updateColumns) as QueryInfo;
    }

    bulkUpdateSelectedRows = (data): Promise<any> => {
        const { model, updateRows } = this.props;
        const rows = !Utils.isEmptyObj(data)
            ? getUpdatedData(this.state.dataForSelection, data, model.queryInfo.pkCols)
            : [];

        return updateRows(model.queryInfo.schemaQuery, rows);
    };

    onEditWithGrid = (updateData: any) => {
        const { onSubmitForEdit } = this.props;
        const { dataForSelection, dataIdsForSelection } = this.state;
        return onSubmitForEdit(updateData, dataForSelection, dataIdsForSelection);
    };

    renderBulkUpdateHeader() {
        const noun = this.getSelectionNoun();

        return (
            <div>
                <p>
                    Make changes to the selected {noun}. Enable a field to update or remove the value for the selected{' '}
                    {noun}.
                </p>
                {this.getSelectionCount() > 1 && (
                    <p>To update individual {noun} in this selection group, select "Edit with Grid".</p>
                )}
            </div>
        );
    }

    render() {
        const { isLoadingDataForSelection, dataForSelection } = this.state;
        const { pluralNoun, model, canSubmitForEdit, onCancel, onComplete } = this.props;
        const fieldValues =
            isLoadingDataForSelection || !dataForSelection ? undefined : getCommonDataValues(dataForSelection);

        return (
            <QueryInfoForm
                allowFieldDisable={true}
                canSubmitForEdit={canSubmitForEdit}
                disableSubmitForEditMsg={'At most ' + MAX_EDITABLE_GRID_ROWS + ' can be edited with the grid.'}
                initiallyDisableFields={true}
                isLoading={isLoadingDataForSelection}
                fieldValues={fieldValues}
                onSubmitForEdit={this.onEditWithGrid}
                onSubmit={this.bulkUpdateSelectedRows}
                onSuccess={onComplete}
                asModal={true}
                includeCountField={false}
                checkRequiredFields={false}
                showLabelAsterisk={true}
                submitForEditText="Edit with Grid"
                submitText={`Update ${capitalizeFirstChar(pluralNoun)}`}
                onHide={onCancel}
                onCancel={onCancel}
                queryInfo={this.getUpdateQueryInfo()}
                schemaQuery={model.queryInfo.schemaQuery}
                title={this.getTitle()}
                header={this.renderBulkUpdateHeader()}
            />
        );
    }
}
