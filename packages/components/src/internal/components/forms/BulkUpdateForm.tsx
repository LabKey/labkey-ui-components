import { Filter, Query, Utils } from '@labkey/api';
import { List, Map } from 'immutable';
import React, { FC, PureComponent } from 'react';

import { Operation, QueryColumn } from '../../../public/QueryColumn';

import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { getSelectedDataDeprecated } from '../../actions';

import {
    capitalizeFirstChar,
    caseInsensitive,
    getCommonDataValues,
    makeCommaSeparatedString,
    pronoun,
} from '../../util/utils';
import { getUpdatedData } from './utils';

import { ComponentsAPIWrapper } from '../../APIWrapper';

import { QueryInfoForm } from './QueryInfoForm';
import { OperationConfirmationData } from '../entities/models';
import { SampleOperation } from '../samples/constants';
import { getOperationNotAllowedMessage, getOperationNotPermittedMessage } from '../samples/utils';
import { Alert } from '../base/Alert';
import { Modal } from '../../Modal';

type UpdateRows = (schemaQuery: SchemaQuery, rows: any[], comment?: string) => Promise<any>;
type UpdateModel = (changes: any) => Promise<void>;

function isUpdateModel(fn: UpdateModel | UpdateRows): fn is UpdateModel {
    return fn.length === 1; // UpdateModel has only one parameter
}

interface SelectionWarningProps {
    aliquots?: number[];
    editStatusData: OperationConfirmationData;
    nounPlural: string;
    nounSingular: string;
    sampleOperation?: SampleOperation;
    selectedCount: number;
}

export const SelectionWarning: FC<SelectionWarningProps> = props => {
    const { aliquots, editStatusData, nounPlural, nounSingular, sampleOperation, selectedCount } = props;
    const totalCount = editStatusData.totalCount;
    const missingCount = selectedCount - totalCount;
    const notPermittedCount = editStatusData.notPermitted.length;
    const messages = [];

    if (aliquots?.length > 0) {
        const count = aliquots.length;
        const nounConjunction = count > 1 ? 's were' : ' was';
        messages.push(
            `Since ${count} aliquot${nounConjunction} among the selected samples, only the aliquot-editable fields are shown below.`
        );
    }

    if (sampleOperation !== undefined && editStatusData.notAllowed.length > 0) {
        messages.push(getOperationNotAllowedMessage(sampleOperation, editStatusData, aliquots, selectedCount));
    }

    if (notPermittedCount > 0) {
        messages.push(getOperationNotPermittedMessage(editStatusData, nounSingular, nounPlural, selectedCount));
    }

    if (missingCount > 0) {
        messages.push(`Cannot edit ${missingCount} of the selected ${nounPlural}, ${pronoun(missingCount, 'they')} may have been deleted.`);
    }

    if (messages.length === 0) return null;

    return (
        <Alert bsStyle="warning">
            {messages.map((message, i) => (
                <div className={i > 0 ? 'top-padding-less' : ''} key={message}>
                    {message}
                </div>
            ))}
        </Alert>
    );
};
SelectionWarning.displayName = 'SelectionWarning';

/**
 * Returns undefined if the selection state is invalid. Returns a string if the selection state is invalid (e.g. all
 * selected items are deleted/missing or the user doesn't have permission to edit any of the selected items).
 */
export function errorMessage(
    editStatusData: OperationConfirmationData,
    nounPlural: string,
    nounSingular: string,
    selectedCount: number
): string | undefined {
    if (!editStatusData) return undefined;

    const missingCount = selectedCount - editStatusData.totalCount;
    const notPermittedCount = editStatusData.notPermitted.length;

    if (missingCount + notPermittedCount !== selectedCount) return undefined;

    const noun = selectedCount > 1 ? nounPlural : nounSingular;
    const parts = [];

    if (notPermittedCount > 0) parts.push(`you do not have the required permissions`);

    if (missingCount > 0) parts.push(`${pronoun(selectedCount, 'they')} may have been deleted`);

    return `Cannot edit selected ${noun}, ${makeCommaSeparatedString(parts, ', or ', '.')}`;
}

export interface BulkUpdateFormProps {
    aliquots?: number[];
    api?: ComponentsAPIWrapper;
    containerFilter?: Query.ContainerFilter;
    disabled?: boolean;
    editStatusData?: OperationConfirmationData;
    includeCommentField?: boolean;
    itemLabel?: string;
    nounPlural: string;
    nounSingular: string;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onCancel: () => void;
    onComplete: (data: any, submitForEdit: boolean, auditUserComment?: string) => void;
    onError?: (message: string) => void;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    queryInfo: QueryInfo;
    requiredColumns?: string[]; // Columns we must retrieve data for
    sampleOperation?: SampleOperation;
    selectedIds: string[];
    uniqueFieldKey?: string;
    updateRows: UpdateModel | UpdateRows;
    // queryInfo.schemaQuery.viewName is likely undefined (i.e., not the current viewName)
    viewName: string;
}

interface State {
    containerPaths: string[];
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    formData: Map<string, any>;
    isLoadingDataForSelection: boolean;
    originalDataForSelection: Map<string, any>;
}

export class BulkUpdateForm extends PureComponent<BulkUpdateFormProps, State> {
    static defaultProps = {
        nounPlural: 'rows',
        nounSingular: 'row',
        includeCommentField: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            containerPaths: undefined,
            dataForSelection: undefined,
            dataIdsForSelection: undefined,
            formData: undefined,
            isLoadingDataForSelection: true,
            originalDataForSelection: undefined,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { onCancel, nounPlural, queryInfo, viewName, requiredColumns } = this.props;
        const { schemaName, name } = queryInfo;

        const columns = queryInfo
            .getPkCols()
            .concat(queryInfo.getUpdateColumns())
            .map(c => c.fieldKey)
            .concat(requiredColumns);

        try {
            const { data, dataIds } = await getSelectedDataDeprecated(
                schemaName,
                name,
                this.getValidSelectedIds(),
                columns,
                undefined,
                undefined,
                viewName
            );
            this.setState({
                containerPaths: this.getContainerPaths(data),
                originalDataForSelection: data,
                dataForSelection: data,
                dataIdsForSelection: dataIds,
                isLoadingDataForSelection: false,
            });
        } catch (reason) {
            console.error(reason);
            this.props.onError?.('There was a problem loading the data for the selected ' + nounPlural + '.');
            onCancel();
        }
    };

    getValidSelectedIds = (): string[] => {
        const { editStatusData, selectedIds } = this.props;

        if (editStatusData) {
            const notPermitted = new Set(
                editStatusData.notPermitted.map(row => caseInsensitive(row, 'RowId').toString(10))
            );
            // Only return the permitted IDs. The notAllowed IDs are considered valid because the user can change
            // values (e.g. sample status) in the form to make them allowed
            return selectedIds.filter(id => !notPermitted.has(id));
        }
        return selectedIds;
    };

    getContainerPaths(data: Map<string, any>): string[] {
        const containerPaths = new Set<string>();

        data.forEach((rowData, id) => {
            if (rowData) {
                const containerPath =
                    caseInsensitive(rowData.toJS(), 'Folder') ?? caseInsensitive(rowData.toJS(), 'Container');
                if (containerPath?.value) containerPaths.add(containerPath.value);
            }
        });
        return Array.from(containerPaths);
    }

    getSelectionCount(): number {
        const { editStatusData, selectedIds } = this.props;
        if (editStatusData) return editStatusData.totalCount;
        return selectedIds.length;
    }

    getSelectionNoun(): string {
        const { nounSingular, nounPlural } = this.props;
        return this.getSelectionCount() === 1 ? nounSingular.toLowerCase() : nounPlural.toLowerCase();
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

    onFormChangeWithData = (formData: Map<string, any>): void => {
        this.setState({ formData });
    };

    onSubmit = (data: any, comment?: string): Promise<any> => {
        const { queryInfo, updateRows } = this.props;

        if (isUpdateModel(updateRows)) {
            return updateRows(data);
        }

        const rows = !Utils.isEmptyObj(data)
            ? getUpdatedData(this.state.originalDataForSelection, data, queryInfo)
            : [];

        return updateRows(queryInfo.schemaQuery, rows, comment);
    };

    renderBulkUpdateHeader() {
        const { aliquots, editStatusData, nounPlural, nounSingular, sampleOperation, selectedIds } = this.props;
        if (!editStatusData) return null;

        const noun = this.getSelectionNoun();

        return (
            <>
                <div>
                    <p>
                        Make changes to the selected {noun}. Enable a field to update or remove the value for the
                        selected {noun}.
                    </p>
                </div>

                <SelectionWarning
                    aliquots={aliquots}
                    editStatusData={editStatusData}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    sampleOperation={sampleOperation}
                    selectedCount={selectedIds.length}
                />
            </>
        );
    }

    render() {
        const { formData, isLoadingDataForSelection, dataForSelection, containerPaths } = this.state;
        const {
            api,
            containerFilter,
            disabled,
            editStatusData,
            includeCommentField,
            nounPlural,
            nounSingular,
            onAdditionalFormDataChange,
            onCancel,
            onComplete,
            queryFilters,
            queryInfo,
            selectedIds,
        } = this.props;
        const fileFields = queryInfo.columns.valueArray.filter(col => col.isFileInput).map(col => col.name);
        const { fieldValues, fieldsInConflict } =
            isLoadingDataForSelection || !dataForSelection ? { fieldValues: undefined, fieldsInConflict: [] } : getCommonDataValues(dataForSelection, fileFields);

        // if all selectedIds are from the same containerPath, use that for the lookups via QueryFormInputs > QuerySelect,
        // if selections are from multiple containerPaths, disable the lookup and file field inputs
        const containerPath = containerPaths?.length === 1 ? containerPaths[0] : undefined;
        const preventCrossFolderEnable = containerPaths?.length > 1;
        const values = formData ? { ...fieldValues, ...formData.toJS() } : fieldValues;
        const error = errorMessage(editStatusData, nounPlural, nounSingular, selectedIds.length);

        if (error) {
            const noun = capitalizeFirstChar(selectedIds.length === 1 ? nounSingular : nounPlural);
            return (
                <Modal cancelText="Dismiss" onCancel={onCancel} title={`Cannot Edit Selected ${noun}`}>
                    <p>{error}</p>
                </Modal>
            );
        }

        return (
            <QueryInfoForm
                allowFieldDisable
                api={api}
                asModal
                checkRequiredFields={false}
                columnFilter={this.columnFilter}
                containerFilter={containerFilter}
                containerPath={containerPath}
                disabled={disabled}
                fieldValues={values}
                fieldWithMixedValues={fieldsInConflict}
                header={this.renderBulkUpdateHeader()}
                includeCommentField={includeCommentField}
                includeCountField={false}
                initiallyDisableFields
                isLoading={isLoadingDataForSelection}
                onAdditionalFormDataChange={onAdditionalFormDataChange}
                onFormChangeWithData={this.onFormChangeWithData}
                onHide={onCancel}
                onSubmit={this.onSubmit}
                onSuccess={onComplete}
                operation={Operation.update}
                pluralNoun={nounPlural}
                preventCrossFolderEnable={preventCrossFolderEnable}
                queryFilters={queryFilters}
                queryInfo={queryInfo}
                renderFileInputs
                showLabelAsterisk
                submitForEditText="Edit with Grid"
                submitText={`Update ${capitalizeFirstChar(nounPlural)}`}
                title={this.getTitle()}
            />
        );
    }
}
