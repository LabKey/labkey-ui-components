import * as React from "react";
import { Map, List } from "immutable";
import { Utils } from "@labkey/api";
import {
    createNotification,
    getCommonDataValues,
    getUpdatedData,
    QueryGridModel,
    QueryInfo,
    SchemaQuery
} from "@glass/base";
import { getSelectedData, MAX_EDITABLE_GRID_ROWS, QueryInfoForm } from "@glass/querygrid";
import { MenuItemModel } from "@glass/navigation";
import { NO_UPDATES_MESSAGE } from "../constants";

interface Props {
    sampleSetItem: MenuItemModel,
    model: QueryGridModel,
    canSubmitForEdit: boolean,
    onCancel: () => any,
    onComplete: (data: any, submitForEdit: boolean) => any
    onSubmitForEdit: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any
    updateRows: (schemaQuery: SchemaQuery, rows: Array<any>) => Promise<any>
}

interface State {
    isLoadingDataForSelection: boolean
    dataForSelection: Map<string, any>
    dataIdsForSelection: List<any>
}

export class SampleBulkUpdate extends React.Component<Props, State> {

    constructor(props) {
        super(props);

        this.state = {
            isLoadingDataForSelection: true,
            dataForSelection: undefined,
            dataIdsForSelection: undefined
        };
    }

    componentWillMount() {
        const { model, onCancel } = this.props;

        getSelectedData(model).then( (response) => {
            const { data, dataIds, totalRows } = response;
            this.setState(() => ({
                isLoadingDataForSelection: false,
                dataForSelection: data,
                dataIdsForSelection: dataIds
            }));
        }).catch((reason) => {
            console.error(reason);
            createNotification({
                alertClass: 'danger',
                message: 'There was a problem loading the data for the selected samples.',
            });
            onCancel();
        });
    }

    getSelectionCount(): number {
        return this.props.model.selectedIds.size;
    }

    getSelectionNoun(): string {
        return this.getSelectionCount() === 1 ? 'sample' : 'samples';
    }

    getTitle(): string {
        const prefix = 'Update ' + this.getSelectionCount() + ' ' + this.getSelectionNoun();
        return prefix + " selected from '" + this.props.sampleSetItem.get('label') + "'";
    }

    getUpdateQueryInfo(): QueryInfo {
        const { model } = this.props;
        const updateColumns = model.queryInfo.columns.filter((column) => (column.shownInUpdateView));
        return model.queryInfo.set('columns', updateColumns) as QueryInfo;
    }

    bulkUpdateSelectedSamples = (data) : Promise<any> => {
        const { model, updateRows } = this.props;
        const rows = !Utils.isEmptyObj(data)? getUpdatedData(this.state.dataForSelection, data, model.queryInfo.pkCols) : [];

        if (rows.length > 0) {
            return updateRows(model.queryInfo.schemaQuery, rows);
        }
        else {
            createNotification(NO_UPDATES_MESSAGE);
            return new Promise<any>((resolve) => resolve(data));
        }
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
                    Make changes to the selected {noun}.
                    Enable a field to update or remove the value for the selected {noun}.
                </p>
                {this.getSelectionCount() > 1 &&
                <p>
                    To update individual samples in this selection group, select "Edit with Grid".
                </p>}
            </div>
        )
    }

    render() {
        const { isLoadingDataForSelection, dataForSelection } = this.state;
        const { model, canSubmitForEdit, onCancel, onComplete } = this.props;
        const fieldValues = isLoadingDataForSelection || !dataForSelection ? undefined : getCommonDataValues(dataForSelection);

        return (
            <QueryInfoForm
                allowFieldDisable={true}
                canSubmitNotDirty={false}
                canSubmitForEdit={canSubmitForEdit}
                disableSubmitForEditMsg={"At most " + MAX_EDITABLE_GRID_ROWS + " can be edited with the grid."}
                initiallyDisableFields={true}
                isLoading={isLoadingDataForSelection}
                fieldValues={fieldValues}
                onSubmitForEdit={this.onEditWithGrid}
                onSubmit={this.bulkUpdateSelectedSamples}
                onSuccess={onComplete}
                asModal={true}
                includeCountField={false}
                checkRequiredFields={false}
                submitForEditText={"Edit with Grid"}
                submitText={"Update Samples"}
                onHide={onCancel}
                onCancel={onCancel}
                queryInfo={this.getUpdateQueryInfo()}
                schemaQuery={model.queryInfo.schemaQuery}
                title={this.getTitle()}
                header={this.renderBulkUpdateHeader()}
            />
        )
    }
}