import React from 'react';
import {List, Map, OrderedMap} from 'immutable';
import { Utils } from '@labkey/api';

import { getSelectedData } from '../../actions';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { capitalizeFirstChar, getCommonDataValues, getUpdatedData } from '../../util/utils';
import { QueryInfo } from '../base/models/QueryInfo';
import { QueryColumn, SchemaQuery } from '../base/models/model';

import { QueryInfoForm } from './QueryInfoForm';

interface Props {
    canSubmitForEdit: boolean;
    itemLabel?: string;
    onComplete: (data: any, submitForEdit: boolean) => any;
    onCancel: () => any;
    onError?: (message: string) => any;
    onSubmitForEdit: (updateData: OrderedMap<string, any>, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
    pluralNoun?: string;
    queryInfo: QueryInfo;
    readOnlyColumns?: List<string>;
    selectedIds: string[];
    shownInUpdateColumns?: boolean;
    singularNoun?: string;
    // sortString is used so we render editable grids with the proper sorts when using onSubmitForEdit
    sortString?: string;
    uniqueFieldKey?: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
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

    componentDidMount(): void {
        const {
            onCancel,
            pluralNoun,
            queryInfo,
            readOnlyColumns,
            selectedIds,
            shownInUpdateColumns,
            sortString,
        } = this.props;
        // Get all shownInUpdateView columns or undefined
        const columns = shownInUpdateColumns
            ? (queryInfo.getPkCols().concat(queryInfo.getUpdateColumns(readOnlyColumns)) as List<QueryColumn>)
            : undefined;
        const columnString = columns?.map(c => c.fieldKey).join(',');
        const { schemaName, name } = queryInfo;
        getSelectedData(schemaName, name, selectedIds, columnString, sortString)
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
        return this.props.selectedIds.length;
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
        const { queryInfo, uniqueFieldKey } = this.props;
        const lcUniqueFieldKey = uniqueFieldKey ? uniqueFieldKey.toLowerCase() : undefined;
        const updateColumns = queryInfo.columns.filter(
            column => column.shownInUpdateView && (!lcUniqueFieldKey || column.name.toLowerCase() !== lcUniqueFieldKey)
        );
        return queryInfo.set('columns', updateColumns) as QueryInfo;
    }

    bulkUpdateSelectedRows = (data): Promise<any> => {
        const { queryInfo, updateRows } = this.props;
        const rows = !Utils.isEmptyObj(data)
            ? getUpdatedData(this.state.dataForSelection, data, queryInfo.pkCols)
            : [];

        return updateRows(queryInfo.schemaQuery, rows);
    };

    onEditWithGrid = (updateData: OrderedMap<string, any>) => {
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
        const { canSubmitForEdit, onCancel, onComplete, pluralNoun, queryInfo } = this.props;
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
                schemaQuery={queryInfo.schemaQuery}
                title={this.getTitle()}
                header={this.renderBulkUpdateHeader()}
            />
        );
    }
}
