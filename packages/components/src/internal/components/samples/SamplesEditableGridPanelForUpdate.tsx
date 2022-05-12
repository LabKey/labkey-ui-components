import React, { ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';

import {
    EditableColumnMetadata,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    EntityDataType,
    GroupedSampleFields,
    IEntityTypeOption,
    IParentOption,
    LoadingSpinner,
    QueryColumn,
    QueryModel,
    SAMPLE_STATE_COLUMN_NAME,
    SampleTypeDataType,
    WizardNavButtons,
} from '../../..';
import { capitalizeFirstChar } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';
import {
    applyEditableGridChangesToModels,
    getUpdatedDataFromEditableGrid,
    initEditableGridModels,
} from '../editable/EditableGridPanelForUpdate';
import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';
import { SampleStatusLegend } from './SampleStatusLegend';
import { EntityParentType } from '../entities/models';

export enum GridTab {
    Samples,
    Storage,
    Lineage,
}

interface Props {
    queryModel: QueryModel;
    loaders: EditableGridLoaderFromSelection[];
    selectionData?: Map<string, any>;
    updateAllTabRows: (updateData: any[]) => Promise<any>;
    onCancel: () => any;
    onComplete: () => any;
    idField: string;
    singularNoun?: string;
    pluralNoun?: string;
    readOnlyColumns?: List<string>;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    includedTabs: GridTab[];

    // passed through from SampleEditableGrid
    parentDataTypes: List<EntityDataType>;
    combineParentTypes?: boolean;
    aliquots: any[];
    noStorageSamples: any[];
    sampleTypeDomainFields: GroupedSampleFields;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}

interface State {
    isSubmitting: boolean;
    dataModels: QueryModel[];
    editorModels: EditorModel[];
    entityParentsMap: Map<string, List<EntityParentType>>;
}

export class SamplesEditableGridPanelForUpdate extends React.Component<Props, State> {
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
            entityParentsMap: fromJS(
                props.parentDataTypes.reduce((map, dataType) => {
                    map[dataType.typeListingSchemaQuery.queryName] = [];
                    return map;
                }, {})
            ),
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
                undefined,
                dataKeys,
                data,
                index
            );
        });
    };

    onSubmit = (): void => {
        const { onComplete, updateAllTabRows, idField, readOnlyColumns, selectionData } = this.props;
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
        } else {
            this.setState(() => ({ isSubmitting: false }), onComplete());
        }
    };

    hasAliquots = (): boolean => {
        const { aliquots } = this.props;
        return aliquots && aliquots.length > 0;
    };

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.props;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    getTabTitle = (tabInd: number): string => {
        const { includedTabs } = this.props;

        if (includedTabs[tabInd] === GridTab.Storage) return 'Storage Details';
        if (includedTabs[tabInd] === GridTab.Lineage) return 'Lineage Details';
        return 'Sample Data';
    };

    getTabHeader = (tabInd: number): ReactNode => {
        const { parentDataTypes, combineParentTypes, parentTypeOptions } = this.props;
        const { entityParentsMap } = this.state;

        const currentTab = this.getCurrentTab(tabInd);

        if (currentTab === GridTab.Lineage) {
            return (
                <>
                    <div className="top-spacing">
                        <EntityParentTypeSelectors
                            parentDataTypes={parentDataTypes}
                            parentOptionsMap={parentTypeOptions}
                            entityParentsMap={entityParentsMap}
                            combineParentTypes={combineParentTypes}
                            onAdd={this.addParentType}
                            onChange={this.changeParentType}
                            onRemove={this.removeParentType}
                        />
                    </div>
                    <div className="sample-status-warning">Lineage for aliquots cannot be changed.</div>
                    <hr />
                </>
            );
        } else if (currentTab === GridTab.Storage) {
            return (
                <div className="top-spacing sample-status-warning">
                    Samples that are not currently in storage are not editable here.
                </div>
            );
        } else {
            return (
                <div className="top-spacing sample-status-warning">
                    Aliquot data inherited from the original sample cannot be updated here.
                </div>
            );
        }
    };

    addParentType = (queryName: string): void => {
        const { entityParentsMap, editorModels } = this.state;
        this.setState({
            editorModels: [...editorModels], // copy models to force re-render
            entityParentsMap: addEntityParentType(queryName, entityParentsMap),
        });
    };

    removeParentType = (index: number, queryName: string): void => {
        const { includedTabs } = this.props;
        const { entityParentsMap, dataModels, editorModels } = this.state;
        const tabIndex = includedTabs.indexOf(GridTab.Lineage);

        const { editorModelChanges, data, queryInfo, entityParents } = removeEntityParentType(
            index,
            queryName,
            entityParentsMap,
            editorModels[tabIndex],
            dataModels[tabIndex].queryInfo,
            fromJS(dataModels[tabIndex].rows)
        );

        const updatedModels = applyEditableGridChangesToModels(
            dataModels,
            editorModels,
            editorModelChanges,
            queryInfo,
            List(dataModels[tabIndex].orderedRows),
            data,
            tabIndex
        );

        this.setState({
            ...updatedModels,
            entityParentsMap: entityParents,
        });
    };

    changeParentType = (
        index: number,
        queryName: string,
        fieldName: string,
        formValue: any,
        parent: IParentOption
    ): void => {
        const { combineParentTypes, includedTabs } = this.props;
        const { entityParentsMap, dataModels, editorModels } = this.state;
        const tabIndex = includedTabs.indexOf(GridTab.Lineage);

        const { editorModelChanges, data, queryInfo, entityParents } = changeEntityParentType(
            index,
            queryName,
            parent,
            editorModels[tabIndex],
            dataModels[tabIndex],
            entityParentsMap,
            SampleTypeDataType,
            combineParentTypes
        );

        const updatedModels = applyEditableGridChangesToModels(
            dataModels,
            editorModels,
            editorModelChanges,
            queryInfo,
            List(dataModels[tabIndex].orderedRows),
            data,
            tabIndex
        );

        this.setState({
            ...updatedModels,
            entityParentsMap: entityParents,
        });
    };

    getReadOnlyRows = (tabInd: number): List<string> => {
        const { aliquots, noStorageSamples, includedTabs } = this.props;

        if (includedTabs[tabInd] === GridTab.Storage) {
            return List<string>(noStorageSamples);
        } else if (includedTabs[tabInd] === GridTab.Lineage) {
            return List<string>(aliquots);
        } else {
            return undefined;
        }
    };

    getSamplesColumnMetadata = (tabInd: number): Map<string, EditableColumnMetadata> => {
        if (this.getCurrentTab(tabInd) !== GridTab.Samples) return undefined;

        const { aliquots, sampleTypeDomainFields, queryModel } = this.props;
        let columnMetadata = getUniqueIdColumnMetadata(queryModel.queryInfo);
        columnMetadata = columnMetadata.set(SAMPLE_STATE_COLUMN_NAME, {
            hideTitleTooltip: true,
            toolTip: <SampleStatusLegend />,
            popoverClassName: 'label-help-arrow-left',
        });

        const allSamples = !aliquots || aliquots.length === 0;
        if (allSamples) return columnMetadata.asImmutable();

        const allAliquots = this.hasAliquots() && aliquots.length === queryModel.selections.size;
        sampleTypeDomainFields.aliquotFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return aliquots.indexOf(key) === -1;
                },
            });
        });

        sampleTypeDomainFields.metaFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return allAliquots || aliquots.indexOf(key) > -1;
                },
            });
        });

        return columnMetadata.asImmutable();
    };

    render() {
        const { onCancel, singularNoun, pluralNoun, ...editableGridProps } = this.props;
        const { isSubmitting, dataModels, editorModels } = this.state;
        const firstModel = dataModels[0];

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
                    getColumnMetadata={this.getSamplesColumnMetadata}
                    editorModel={editorModels}
                    forUpdate
                    model={dataModels}
                    onChange={this.onGridChange}
                    striped
                    title={`Edit selected ${pluralNoun}`}
                    getTabTitle={this.getTabTitle}
                    getTabHeader={this.getTabHeader}
                    getReadOnlyRows={this.getReadOnlyRows}
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
