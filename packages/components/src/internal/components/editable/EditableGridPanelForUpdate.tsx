import React from 'react';
import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import {
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    LoadingSpinner,
    QueryModel,
    SchemaQuery,
    WizardNavButtons,
} from '../../..';
import { capitalizeFirstChar } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid, initEditableGridModels } from './utils';

interface Props {
    containerFilter?: Query.ContainerFilter;
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

    componentDidMount(): void {
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
                idField,
                undefined,
                selectionData,
                ind
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
        const { containerFilter, onCancel, singularNoun, pluralNoun, ...editableGridProps } = this.props;
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
                    columnMetadata={columnMetadata}
                    containerFilter={containerFilter}
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
