import React, { PureComponent, ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Query, Utils } from '@labkey/api';

import { getSelectedData } from '../../actions';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { capitalizeFirstChar, getCommonDataValues, getUpdatedData } from '../../util/utils';

import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryColumn } from '../../../public/QueryColumn';

import { QueryInfoForm } from './QueryInfoForm';

interface Props {
    canSubmitForEdit: boolean;
    containerFilter?: Query.ContainerFilter;
    header?: ReactNode;
    itemLabel?: string;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onCancel: () => void;
    onComplete: (data: any, submitForEdit: boolean) => void;
    onError?: (message: string) => void;
    onSubmitForEdit: (
        updateData: OrderedMap<string, any>,
        dataForSelection: Map<string, any>,
        dataIdsForSelection: List<any>
    ) => any;
    pluralNoun?: string;
    queryInfo: QueryInfo;
    viewName: string; // queryInfo.schemaQuery.viewName is likely undefined (i.e., not the current viewName)
    readOnlyColumns?: List<string>;
    requiredColumns?: string[];
    selectedIds: Set<string>;
    shownInUpdateColumns?: boolean;
    singularNoun?: string;
    // sortString is used so we render editable grids with the proper sorts when using onSubmitForEdit
    sortString?: string;
    uniqueFieldKey?: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
}

interface State {
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    errorMsg: string;
    isLoadingDataForSelection: boolean;
}

export class BulkUpdateForm extends PureComponent<Props, State> {
    static defaultProps = {
        itemLabel: 'table',
        pluralNoun: 'rows',
        singularNoun: 'row',
    };

    constructor(props) {
        super(props);

        this.state = {
            dataForSelection: undefined,
            dataIdsForSelection: undefined,
            errorMsg: undefined,
            isLoadingDataForSelection: true,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { onCancel, pluralNoun, queryInfo, readOnlyColumns, selectedIds, shownInUpdateColumns, sortString, viewName, requiredColumns } =
            this.props;
        // Get all shownInUpdateView and required columns or undefined
        const columns = (shownInUpdateColumns || requiredColumns)
            ? (queryInfo.getPkCols().concat(queryInfo.getUpdateColumns(readOnlyColumns)) as List<QueryColumn>)
            : undefined;
        let columnString = columns?.map(c => c.fieldKey).join(',');
        if (requiredColumns)
            columnString = `${columnString ? columnString + ',' : ''}${requiredColumns.join(',')}`;

        const { schemaName, name } = queryInfo;

        try {
            const { data, dataIds } = await getSelectedData(
                schemaName,
                name,
                Array.from(selectedIds),
                columnString,
                sortString,
                undefined,
                viewName
            );
            this.setState({
                dataForSelection: data,
                dataIdsForSelection: dataIds,
                isLoadingDataForSelection: false,
            });
        } catch (reason) {
            console.error(reason);
            this.props.onError?.('There was a problem loading the data for the selected ' + pluralNoun + '.');
            onCancel();
        }
    };

    getSelectionCount(): number {
        return this.props.selectedIds.size;
    }

    getSelectionNoun(): string {
        const { singularNoun, pluralNoun } = this.props;
        return this.getSelectionCount() === 1 ? singularNoun : pluralNoun;
    }

    getTitle(): string {
        const prefix = 'Update ' + this.getSelectionCount() + ' ' + this.getSelectionNoun();
        return prefix + " selected from '" + this.props.itemLabel + "'";
    }

    columnFilter = (col: QueryColumn): boolean => {
        const lcUniqueFieldKey = this.props.uniqueFieldKey?.toLowerCase();
        return col.isUpdateColumn && (!lcUniqueFieldKey || col.name.toLowerCase() !== lcUniqueFieldKey);
    };

    onSubmit = (data): Promise<any> => {
        const { queryInfo, updateRows } = this.props;
        const rows = !Utils.isEmptyObj(data) ? getUpdatedData(this.state.dataForSelection, data, queryInfo.pkCols) : [];

        return updateRows(queryInfo.schemaQuery, rows);
    };

    onSubmitForEdit = (updateData: OrderedMap<string, any>) => {
        const { dataForSelection, dataIdsForSelection } = this.state;
        return this.props.onSubmitForEdit(updateData, dataForSelection, dataIdsForSelection);
    };

    renderBulkUpdateHeader() {
        const { header } = this.props;
        const noun = this.getSelectionNoun();

        return (
            <>
                <div>
                    <p>
                        Make changes to the selected {noun}. Enable a field to update or remove the value for the
                        selected {noun}.
                    </p>
                    {this.getSelectionCount() > 1 && (
                        <p>To update individual {noun} in this selection group, select "Edit with Grid".</p>
                    )}
                </div>
                {header}
            </>
        );
    }

    render() {
        const { isLoadingDataForSelection, dataForSelection } = this.state;
        const {
            canSubmitForEdit,
            containerFilter,
            onCancel,
            onComplete,
            pluralNoun,
            queryInfo,
            onAdditionalFormDataChange,
        } = this.props;
        const fieldValues =
            isLoadingDataForSelection || !dataForSelection ? undefined : getCommonDataValues(dataForSelection);

        return (
            <QueryInfoForm
                allowFieldDisable
                asModal
                canSubmitForEdit={canSubmitForEdit}
                checkRequiredFields={false}
                columnFilter={this.columnFilter}
                containerFilter={containerFilter}
                disableSubmitForEditMsg={'At most ' + MAX_EDITABLE_GRID_ROWS + ' can be edited with the grid.'}
                fieldValues={fieldValues}
                header={this.renderBulkUpdateHeader()}
                includeCountField={false}
                initiallyDisableFields
                isLoading={isLoadingDataForSelection}
                onCancel={onCancel}
                onHide={onCancel}
                onSubmitForEdit={this.onSubmitForEdit}
                onSubmit={this.onSubmit}
                onSuccess={onComplete}
                renderFileInputs
                queryInfo={queryInfo}
                showLabelAsterisk
                submitForEditText="Edit with Grid"
                submitText={`Update ${capitalizeFirstChar(pluralNoun)}`}
                title={this.getTitle()}
                onAdditionalFormDataChange={onAdditionalFormDataChange}
            />
        );
    }
}
