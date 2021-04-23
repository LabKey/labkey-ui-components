import React from 'react';
import { List, Map } from 'immutable';

import { getEditorModel } from '../../global';

import { EditableColumnMetadata, QueryColumn, QueryGridModel, SchemaQuery, WizardNavButtons } from '../../..';
import { capitalizeFirstChar, getUpdatedDataFromGrid } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { EditableGridPanel } from './EditableGridPanel';

interface Props {
    model: QueryGridModel | List<QueryGridModel>;
    selectionData: Map<string, any>;
    onCancel: () => any;
    onComplete: () => any;
    updateRows?: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
    updateAllTabRows?: (updateData: any[]) => Promise<any>;
    idField: string;
    readOnlyColumns?: List<string>;
    readOnlyRows?: List<any>;
    singularNoun?: string;
    pluralNoun?: string;
    columnMetadata?: Map<string, EditableColumnMetadata>;

    activeTab?: number;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    getColumnMetadata?: (tabId?: number) => Map<string, EditableColumnMetadata>;
    getSelectionData?: (tabId?: number) => Map<string, any>;
    getReadOnlyColumns?: (tabId?: number) => List<string>;
    getReadOnlyRows?: (tabId?: number) => List<any>;
    getIdField?: (tabId?: number) => string;
    getTabTitle?: (tabId?: number) => string;
}

interface State {
    isSubmitting: boolean;
}

export class EditableGridPanelForUpdate extends React.Component<Props, State> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
    };

    constructor(props) {
        super(props);

        this.state = {
            isSubmitting: false,
        };
    }

    getModelsAsList(props: Props): List<QueryGridModel> {
        const { model } = props;
        return List.isList(model) ? List(model.toArray()) : List<QueryGridModel>([model]);
    }

    getModel = () => {
        const models = this.getModelsAsList(this.props);

        return models.get(0);
    };

    updateDataFromGrid = () => {
        const { onComplete, updateRows, updateAllTabRows } = this.props;

        const gridDataAllTabs = [];
        this.getModelsAsList(this.props).forEach((model, ind) => {
            const gridData = this.getUpdateDataFromGrid(ind);
            if (gridData && gridData.updatedRows.length > 0) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            this.setState(() => ({ isSubmitting: true }));
            if (updateAllTabRows) {
                updateAllTabRows(gridDataAllTabs).then(responses => {
                    this.setState(() => ({ isSubmitting: false }), onComplete());
                });
            } else if (updateRows) {
                const updatePromises = [];
                gridDataAllTabs.forEach(data => updatePromises.push(updateRows(data.schemaQuery, data.updatedRows)));
                Promise.all(updatePromises).then(responses => {
                    this.setState(() => ({ isSubmitting: false }), onComplete());
                });
            }
        } else {
            this.setState(() => ({ isSubmitting: false }), onComplete());
        }
    };

    getUpdateDataFromGrid = (tabIndex: number) => {
        const models = this.getModelsAsList(this.props);
        const model = models.get(tabIndex ? tabIndex : 0);
        const idField = this.props.getIdField ? this.props.getIdField(tabIndex) : this.props.idField;
        const readOnlyColumns = this.props.getReadOnlyColumns
            ? this.props.getReadOnlyColumns(tabIndex)
            : this.props.readOnlyColumns;
        const selectionData = this.props.getSelectionData
            ? this.props.getSelectionData(tabIndex)
            : this.props.selectionData;

        const editorModel = getEditorModel(model.getId());
        if (!editorModel) {
            console.error('Grid does not expose an editor. Ensure the grid is properly initialized for editing.');
            return null;
        } else {
            // Issue 37842: if we have data for the selection, this was the data that came from the display grid and was used
            // to populate the queryInfoForm.  If we don't have this data, we came directly to the editable grid
            // using values from the display grid to initialize the editable grid model, so we use that.
            const initData = selectionData ? selectionData : model.data;
            const editorData = editorModel.getRawData(model, true, true, readOnlyColumns).toArray();
            const updatedRows = getUpdatedDataFromGrid(initData, editorData, idField, model.queryInfo);

            return {
                schemaQuery: model.queryInfo.schemaQuery,
                updatedRows,
                tabIndex,
            };
        }
    };

    render() {
        const {
            model,
            readOnlyColumns,
            readOnlyRows,
            activeTab,
            onCancel,
            singularNoun,
            pluralNoun,
            columnMetadata,
            getUpdateColumns,
            getColumnMetadata,
            getReadOnlyRows,
            getReadOnlyColumns,
            getTabTitle,
        } = this.props;
        const { isSubmitting } = this.state;

        const firstModel = this.getModel();
        let cMetadata = columnMetadata;
        if (!cMetadata && !getColumnMetadata) cMetadata = getUniqueIdColumnMetadata(firstModel.queryInfo);

        return (
            <>
                <EditableGridPanel
                    title={`Edit selected ${pluralNoun}`}
                    bsStyle="info"
                    models={model}
                    model={firstModel}
                    readOnlyColumns={readOnlyColumns}
                    readonlyRows={readOnlyRows}
                    allowAdd={false}
                    allowRemove={false}
                    bordered={true}
                    striped={true}
                    forUpdate={true}
                    columnMetadata={cMetadata}
                    getUpdateColumns={getUpdateColumns}
                    activeTab={activeTab}
                    getColumnMetadata={getColumnMetadata}
                    getReadOnlyColumns={getReadOnlyColumns}
                    getReadOnlyRows={getReadOnlyRows}
                    getTabTitle={getTabTitle}
                />
                <WizardNavButtons
                    cancel={onCancel}
                    nextStep={this.updateDataFromGrid}
                    finish={true}
                    isFinishing={isSubmitting}
                    isFinishingText="Updating..."
                    isFinishedText="Finished Updating"
                    finishText={
                        'Finish Updating ' +
                        firstModel.data.size +
                        ' ' +
                        (firstModel.data.size === 1
                            ? capitalizeFirstChar(singularNoun)
                            : capitalizeFirstChar(pluralNoun))
                    }
                />
            </>
        );
    }
}
