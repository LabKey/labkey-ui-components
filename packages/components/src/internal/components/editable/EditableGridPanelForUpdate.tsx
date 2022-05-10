import React from 'react';
import { fromJS, List, Map } from 'immutable';

import {
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    loadEditorModelData,
    LoadingSpinner,
    LoadingState,
    QueryInfo,
    QueryModel,
    SchemaQuery,
    WizardNavButtons,
} from '../../..';
import { capitalizeFirstChar, getUpdatedDataFromGrid } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

interface Props {
    queryModel: QueryModel;
    loader: EditableGridLoaderFromSelection;
    selectionData: Map<string, any>;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
    onCancel: () => any;
    onComplete: () => any;
    idField: string;
    singularNoun?: string;
    pluralNoun?: string;
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

    constructor(props: Props) {
        super(props);

        const id = props.loader.id;
        const dataModels = [new QueryModel({ id, schemaQuery: props.queryModel.schemaQuery })];
        const editorModels = [new EditorModel({ id })];

        this.state = {
            isSubmitting: false,
            dataModels,
            editorModels,
        };
    }

    componentDidMount() {
        this.initEditorModel();
    }

    initEditorModel = async (): Promise<void> => {
        const { queryModel, loader } = this.props;
        const { dataModels, editorModels } = await initEditableGridModels(
            this.state.dataModels,
            this.state.editorModels,
            queryModel,
            [loader]
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
                undefined,
                dataKeys,
                data,
                index
            );
        });
    };

    onSubmit = (): void => {
        const { onComplete, updateRows, idField, selectionData } = this.props;
        const { dataModels, editorModels } = this.state;

        const gridDataAllTabs = [];
        dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(
                dataModels,
                editorModels,
                ind,
                idField,
                undefined,
                selectionData
            );
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            this.setState(() => ({ isSubmitting: true }));
            const updatePromises = [];
            gridDataAllTabs.forEach(data => updatePromises.push(updateRows(data.schemaQuery, data.updatedRows)));
            Promise.all(updatePromises).then(() => {
                this.setState(() => ({ isSubmitting: false }), onComplete());
            });
        } else {
            this.setState(() => ({ isSubmitting: false }), onComplete());
        }
    };

    render() {
        const { onCancel, singularNoun, pluralNoun, ...editableGridProps } =
            this.props;
        const { isSubmitting, dataModels, editorModels } = this.state;
        const firstModel = dataModels[0];
        const columnMetadata = getUniqueIdColumnMetadata(firstModel.queryInfo);

        if (firstModel.isLoading) {
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
                    editorModel={editorModels}
                    columnMetadata={columnMetadata}
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
    queryInfo?: QueryInfo,
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
        let dataModel = dataModels[index].mutate({ orderedRows, rows });
        if (queryInfo) dataModel = dataModels[index].mutate({ queryInfo });
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
