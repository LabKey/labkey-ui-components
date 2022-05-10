import React, { ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';

import {
    EditableColumnMetadata,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    loadEditorModelData,
    LoadingSpinner,
    LoadingState,
    QueryColumn,
    QueryModel,
    SchemaQuery,
    WizardNavButtons,
} from '../../..';
import { capitalizeFirstChar, getUpdatedDataFromGrid } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

interface Props {
    queryModel: QueryModel;
    selectionData?: Map<string, any>;
    loaders: EditableGridLoaderFromSelection[];
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
    getReadOnlyRows?: (tabId?: number) => List<any>;
    getTabTitle?: (tabId?: number) => string;
    getTabHeader?: (tabId?: number) => ReactNode;
}

interface State {
    isSubmitting: boolean;
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}

export class EditableGridPanelForUpdate extends React.Component<Props, State> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
    };

    constructor(props) {
        super(props);

        const dataModels = [];
        const editorModels = [];
        props.loaders.forEach(loader => {
            dataModels.push(new QueryModel({ id: loader.id, schemaQuery: props.queryModel.schemaQuery }));
            editorModels.push(new EditorModel({ id: loader.id }));
        });

        this.state = {
            isSubmitting: false,
            dataModels,
            editorModels,
        };
    }

    componentDidMount() {
        if (this.props.loaders) this.initEditorModel();
    }

    initEditorModel = async (): Promise<void> => {
        const { queryModel, loaders } = this.props;
        const { dataModels, editorModels } = await initEditableGridModels(
            this.state.dataModels,
            this.state.editorModels,
            queryModel,
            loaders
        );
        this.setState({ dataModels, editorModels });
    };

    onGridChange = (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>,
        index = 0
    ): void => {
        this.setState(state => {
            const { dataModels, editorModels } = state;
            return applyEditableGridChangesToModels(
                dataModels,
                editorModels,
                editorModelChanges,
                dataKeys,
                data,
                index
            );
        });
    };

    onSubmit = (): void => {
        const { onComplete, updateRows, updateAllTabRows, idField, readOnlyColumns, selectionData } = this.props;
        const { dataModels, editorModels } = this.state;

        const gridDataAllTabs = [];
        dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(
                dataModels,
                editorModels,
                ind,
                idField,
                readOnlyColumns,
                selectionData
            );
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            this.setState(() => ({ isSubmitting: true }));
            if (updateAllTabRows) {
                updateAllTabRows(gridDataAllTabs).then(result => {
                    this.setState(
                        () => ({ isSubmitting: false }),
                        () => {
                            if (result !== false) {
                                onComplete();
                            }
                        }
                    );
                });
            } else if (updateRows) {
                const updatePromises = [];
                gridDataAllTabs.forEach(data => updatePromises.push(updateRows(data.schemaQuery, data.updatedRows)));
                Promise.all(updatePromises).then(() => {
                    this.setState(() => ({ isSubmitting: false }), onComplete());
                });
            }
        } else {
            this.setState(() => ({ isSubmitting: false }), onComplete());
        }
    };

    render() {
        const { onCancel, singularNoun, pluralNoun, columnMetadata, getColumnMetadata, ...editableGridProps } =
            this.props;
        const { isSubmitting, dataModels, editorModels } = this.state;

        const firstModel = dataModels[0];
        let cMetadata = columnMetadata;
        if (!cMetadata && !getColumnMetadata) cMetadata = getUniqueIdColumnMetadata(firstModel.queryInfo);

        if (!dataModels.every(dataModel => !dataModel.isLoading)) {
            return <LoadingSpinner />;
        }

        return (
            <>
                <EditableGridPanel
                    {...editableGridProps}
                    allowAdd={false}
                    allowRemove={false}
                    bordered
                    bsStyle="info"
                    columnMetadata={cMetadata}
                    getColumnMetadata={getColumnMetadata}
                    editorModel={editorModels}
                    forUpdate
                    model={dataModels}
                    onChange={this.onGridChange}
                    striped
                    title={`Edit selected ${pluralNoun}`}
                />
                <WizardNavButtons
                    cancel={onCancel}
                    nextStep={this.onSubmit}
                    finish={true}
                    isFinishing={isSubmitting}
                    isFinishingText="Updating..."
                    isFinishedText="Finished Updating"
                    finishText={
                        'Finish Updating ' +
                        firstModel.orderedRows.length +
                        ' ' +
                        (firstModel.orderedRows.length === 1
                            ? capitalizeFirstChar(singularNoun)
                            : capitalizeFirstChar(pluralNoun))
                    }
                />
            </>
        );
    }
}

export const initEditableGridModels = async (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    queryModel: QueryModel,
    loaders: EditableGridLoaderFromSelection[]
): Promise<{
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}> => {
    const updatedDataModels = [];
    const updatedEditorModels = [];
    for (const loader of loaders) {
        const index = loaders.indexOf(loader);
        const response = await loader.fetch(queryModel);
        const gridData = {
            rows: response.data.toJS(),
            orderedRows: response.dataIds.toArray(),
            queryInfo: loader.queryInfo,
        };
        const editorModelData = await loadEditorModelData(gridData, loader.updateColumns);

        updatedDataModels.push(
            dataModels[index].mutate({
                ...gridData,
                rowsLoadingState: LoadingState.LOADED,
                queryInfoLoadingState: LoadingState.LOADED,
            })
        );
        updatedEditorModels.push(editorModels[index].merge(editorModelData) as EditorModel);
    }

    return {
        dataModels: updatedDataModels,
        editorModels: updatedEditorModels,
    };
};

export const applyEditableGridChangesToModels = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    editorModelChanges: Partial<EditorModelProps>,
    dataKeys?: List<any>,
    data?: Map<string, Map<string, any>>,
    index = 0
): {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
} => {
    const updatedEditorModels = [...editorModels];
    const editorModel = editorModels[index].merge(editorModelChanges) as EditorModel;
    updatedEditorModels.splice(index, 1, editorModel);

    const updatedDataModels = [...dataModels];
    const orderedRows = dataKeys?.toJS();
    const rows = data?.toJS();
    if (orderedRows !== undefined && rows !== undefined) {
        const dataModel = dataModels[index].mutate({ orderedRows, rows });
        updatedDataModels.splice(index, 1, dataModel);
    }

    return {
        dataModels: updatedDataModels,
        editorModels: updatedEditorModels,
    };
};

export const getUpdatedDataFromEditableGrid = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    tabIndex = 0,
    idField: string,
    readOnlyColumns?: List<string>,
    selectionData?: Map<string, any>
): Record<string, any> => {
    const model = dataModels[tabIndex];
    const editorModel = editorModels[tabIndex];

    if (!editorModel) {
        console.error('Grid does not expose an editor. Ensure the grid is properly initialized for editing.');
        return null;
    } else {
        // Issue 37842: if we have data for the selection, this was the data that came from the display grid and was used
        // to populate the queryInfoForm.  If we don't have this data, we came directly to the editable grid
        // using values from the display grid to initialize the editable grid model, so we use that.
        const initData = selectionData ?? fromJS(model.rows);
        const editorData = editorModel
            .getRawDataFromGridData(
                fromJS(model.rows),
                fromJS(model.orderedRows),
                model.queryInfo,
                true,
                true,
                readOnlyColumns
            )
            .toArray();
        const updatedRows = getUpdatedDataFromGrid(initData, editorData, idField, model.queryInfo);

        return {
            schemaQuery: model.queryInfo.schemaQuery,
            updatedRows,
            originalRows: model.rows,
            tabIndex,
        };
    }
};
