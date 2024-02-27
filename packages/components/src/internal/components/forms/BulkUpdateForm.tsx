import { Filter, Query, Utils } from '@labkey/api';
import { List, Map, OrderedMap } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';

import { Operation, QueryColumn } from '../../../public/QueryColumn';

import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { getSelectedData } from '../../actions';

import { capitalizeFirstChar, getCommonDataValues, getUpdatedData } from '../../util/utils';

import { QueryInfoForm } from './QueryInfoForm';

interface Props {
    containerFilter?: Query.ContainerFilter;
    disabled?: boolean;
    displayValueFields?: string[];
    getUpdateColumnsOnly?: boolean;
    header?: ReactNode;
    itemLabel?: string;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onCancel: () => void;
    onComplete: (data: any, submitForEdit: boolean, auditUserComment?: string) => void;
    onError?: (message: string) => void;
    onSubmitForEdit: (
        updateData: OrderedMap<string, any>,
        dataForSelection: Map<string, any>,
        dataIdsForSelection: List<any>,
        comment?: string
    ) => any;
    pluralNoun?: string;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    queryInfo: QueryInfo;
    readOnlyColumns?: string[];
    requiredColumns?: string[];
    selectedIds: Set<string>;
    singularNoun?: string;
    // sortString is used so we render editable grids with the proper sorts when using onSubmitForEdit
    sortString?: string;
    uniqueFieldKey?: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[], comment?: string) => Promise<any>;
    // queryInfo.schemaQuery.viewName is likely undefined (i.e., not the current viewName)
    viewName: string;
}

interface State {
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    displayFieldUpdates: any;
    errorMsg: string;
    isLoadingDataForSelection: boolean;
    originalDataForSelection: Map<string, any>;
}

export class BulkUpdateForm extends PureComponent<Props, State> {
    static defaultProps = {
        pluralNoun: 'rows',
        singularNoun: 'row',
        getUpdateColumnsOnly: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            originalDataForSelection: undefined,
            dataForSelection: undefined,
            displayFieldUpdates: {},
            dataIdsForSelection: undefined,
            errorMsg: undefined,
            isLoadingDataForSelection: true,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const {
            onCancel,
            pluralNoun,
            queryInfo,
            readOnlyColumns,
            selectedIds,
            getUpdateColumnsOnly,
            sortString,
            viewName,
            requiredColumns,
        } = this.props;
        // Get all shownInUpdateView and required columns or undefined
        const columns =
            getUpdateColumnsOnly || requiredColumns
                ? queryInfo.getPkCols().concat(queryInfo.getUpdateColumns(readOnlyColumns ?? []))
                : undefined;
        let columnString = columns?.map(c => c.fieldKey).join(',');
        if (requiredColumns) columnString = `${columnString ? columnString + ',' : ''}${requiredColumns.join(',')}`;

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
            const mappedData = this.mapDataForDisplayFields(data);
            this.setState({
                originalDataForSelection: data,
                dataForSelection: mappedData.data,
                displayFieldUpdates: mappedData.bulkUpdates,
                dataIdsForSelection: dataIds,
                isLoadingDataForSelection: false,
            });
        } catch (reason) {
            console.error(reason);
            this.props.onError?.('There was a problem loading the data for the selected ' + pluralNoun + '.');
            onCancel();
        }
    };

    mapDataForDisplayFields(data: Map<string, any>): { bulkUpdates: OrderedMap<string, any>; data: Map<string, any> } {
        const { displayValueFields } = this.props;
        let updates = Map<string, any>();
        let bulkUpdates = OrderedMap<string, any>();

        if (!displayValueFields) return { data, bulkUpdates };

        let conflictKeys = new Set<string>();
        data.forEach((rowData, id) => {
            if (rowData) {
                let updatedRow = Map<string, any>();
                rowData.forEach((field, key) => {
                    if (displayValueFields.includes(key)) {
                        const valuesDiffer =
                            field.has('displayValue') && field.get('value') !== field.get('displayValue');
                        let comparisonValue = field.get('displayValue') ?? field.get('value');
                        if (comparisonValue) comparisonValue += ''; // force to string
                        if (!conflictKeys.has(key)) {
                            if (!bulkUpdates.has(key)) {
                                bulkUpdates = bulkUpdates.set(key, comparisonValue);
                            } else if (bulkUpdates.get(key) !== comparisonValue) {
                                bulkUpdates = bulkUpdates.remove(key);
                                conflictKeys = conflictKeys.add(key);
                            }
                        }
                        if (valuesDiffer) {
                            field = field.set('value', comparisonValue);
                        }
                    }
                    updatedRow = updatedRow.set(key, field);
                });
                if (!updatedRow.isEmpty()) updates = updates.set(id, updatedRow);
            }
        });
        if (!updates.isEmpty()) return { data: data.merge(updates), bulkUpdates };
        return { data, bulkUpdates };
    }

    getSelectionCount(): number {
        return this.props.selectedIds.size;
    }

    getSelectionNoun(): string {
        const { singularNoun, pluralNoun } = this.props;
        return this.getSelectionCount() === 1 ? singularNoun.toLowerCase() : pluralNoun.toLowerCase();
    }

    getTitle(): string {
        const { itemLabel } = this.props;
        const prefix = 'Update ' + this.getSelectionCount() + ' ' + this.getSelectionNoun();
        return itemLabel ? prefix + " selected from '" + this.props.itemLabel + "'" : prefix;
    }

    columnFilter = (col: QueryColumn): boolean => {
        const lcUniqueFieldKey = this.props.uniqueFieldKey?.toLowerCase();
        return col.isUpdateColumn && (!lcUniqueFieldKey || col.name.toLowerCase() !== lcUniqueFieldKey);
    };

    onSubmit = (data: any, comment?: string): Promise<any> => {
        const { queryInfo, updateRows } = this.props;
        const { displayFieldUpdates } = this.state;
        const updateData = displayFieldUpdates.merge(data);
        const rows = !Utils.isEmptyObj(data)
            ? getUpdatedData(this.state.originalDataForSelection, updateData, queryInfo.pkCols, queryInfo.altUpdateKeys)
            : [];

        return updateRows(queryInfo.schemaQuery, rows, comment);
    };

    onSubmitForEdit = (updateData: OrderedMap<string, any>, comment?: string) => {
        const { dataForSelection, dataIdsForSelection } = this.state;
        return this.props.onSubmitForEdit(updateData, dataForSelection, dataIdsForSelection, comment);
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
            containerFilter,
            onCancel,
            onComplete,
            pluralNoun,
            queryFilters,
            queryInfo,
            onAdditionalFormDataChange,
            disabled,
        } = this.props;
        const fieldValues =
            isLoadingDataForSelection || !dataForSelection ? undefined : getCommonDataValues(dataForSelection);

        return (
            <QueryInfoForm
                allowFieldDisable
                asModal
                checkRequiredFields={false}
                columnFilter={this.columnFilter}
                containerFilter={containerFilter}
                disabled={disabled}
                fieldValues={fieldValues}
                header={this.renderBulkUpdateHeader()}
                includeCommentField={true}
                includeCountField={false}
                initiallyDisableFields
                isLoading={isLoadingDataForSelection}
                onHide={onCancel}
                operation={Operation.update}
                onSubmitForEdit={this.onSubmitForEdit}
                onSubmit={this.onSubmit}
                onSuccess={onComplete}
                renderFileInputs
                queryInfo={queryInfo}
                queryFilters={queryFilters}
                showLabelAsterisk
                submitForEditText="Edit with Grid"
                submitText={`Update ${capitalizeFirstChar(pluralNoun)}`}
                title={this.getTitle()}
                onAdditionalFormDataChange={onAdditionalFormDataChange}
            />
        );
    }
}
