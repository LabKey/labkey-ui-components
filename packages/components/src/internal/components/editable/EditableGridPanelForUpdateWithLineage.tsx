import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { fromJS, List, Map } from 'immutable';

import {
    createNotification,
    EditableColumnMetadata,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    EntityDataType,
    IEntityTypeOption,
    IParentOption,
    LoadingSpinner,
    QueryColumn,
    QueryModel,
    WizardNavButtons,
} from '../../../index';
import { capitalizeFirstChar } from '../../util/utils';

import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';
import { EntityParentType } from '../entities/models';

import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid, initEditableGridModels } from './utils';
import {SharedEditableGridPanelProps} from "./EditableGrid";

export enum UpdateGridTab {
    Samples,
    DataClasses,
    Storage,
    Lineage,
}

const DEFAULT_SINGULAR_NOUN = 'row';
const DEFAULT_PLURAL_NOUN = 'rows';

export interface EditableGridPanelForUpdateWithLineageProps
    extends Omit<SharedEditableGridPanelProps, 'allowAdd' | 'allowRemove' | 'forUpdate'> {
    combineParentTypes?: boolean;
    getParentTypeWarning?: () => ReactNode;
    idField: string;
    includedTabs: UpdateGridTab[];
    loaders: EditableGridLoaderFromSelection[];
    onCancel: () => void;
    onComplete: () => void;
    parentDataTypes: List<EntityDataType>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    pluralNoun?: string;
    queryModel: QueryModel;
    selectionData?: Map<string, any>;
    singularNoun?: string;
    targetEntityDataType: EntityDataType;
    updateAllTabRows: (updateData: any[]) => Promise<boolean>;
}

// See note in onGridChange
let editableGridUpdateAggregate: Partial<EditorModelProps>;

export const EditableGridPanelForUpdateWithLineage: FC<EditableGridPanelForUpdateWithLineageProps> = memo(props => {
    const {
        combineParentTypes,
        getParentTypeWarning,
        getTabHeader,
        idField,
        includedTabs,
        loaders,
        onCancel,
        onComplete,
        parentDataTypes,
        parentTypeOptions,
        pluralNoun = DEFAULT_PLURAL_NOUN,
        queryModel,
        readOnlyColumns,
        selectionData,
        singularNoun = DEFAULT_SINGULAR_NOUN,
        targetEntityDataType,
        updateAllTabRows,
        ...gridProps
    } = props;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [dataModels, setDataModels] = useState<QueryModel[]>();
    const [editorModels, setEditorModels] = useState<EditorModel[]>();
    const [entityParentsMap, setEntityParentsMap] = useState<Map<string, List<EntityParentType>>>();

    useEffect(() => {
        const dataModels = [];
        const editorModels = [];
        loaders.forEach(loader => {
            dataModels.push(new QueryModel({ id: loader.id, schemaQuery: props.queryModel.schemaQuery }));
            editorModels.push(new EditorModel({ id: loader.id }));
        });

        setIsSubmitting(false);
        setDataModels(dataModels);
        setEditorModels(editorModels);
        setEntityParentsMap(
            fromJS(
                parentDataTypes.reduce((map, dataType) => {
                    map[dataType.typeListingSchemaQuery.queryName] = [];
                    return map;
                }, {})
            )
        );
    }, [loaders, parentDataTypes]);

    useEffect(() => {
        const initEditorModel = async (): Promise<{
            dataModels: QueryModel[];
            editorModels: EditorModel[];
        }> => {
            return await initEditableGridModels(dataModels, editorModels, queryModel, loaders);
        };

        if (loaders && dataModels?.find(dataModel => dataModel.isLoading)) {
            initEditorModel().then(models => {
                setDataModels(models.dataModels);
                setEditorModels(models.editorModels);
            }).catch(error => {
                createNotification({
                    message: error,
                    alertClass: "danger"
                })
            })
        }
    }, [loaders, dataModels, editorModels]);

    // Intentionally fires with every render, see note in onGridChange
    useEffect(() => {
        editableGridUpdateAggregate = undefined;
    });

    const onGridChange = (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>,
        index?: number
    ): void => {
        // For some cell types, editable grid fires multiple onChange events with different parameters for a given browser event.
        // This doesn't allow state to be set between onChange calls for a single browser event, thus this goes outside
        // the normal functional component life-cycle to aggregate the onChange events between renders.
        editableGridUpdateAggregate = { ...editableGridUpdateAggregate, ...editorModelChanges };

        const models = applyEditableGridChangesToModels(
            dataModels,
            editorModels,
            editableGridUpdateAggregate,
            undefined,
            dataKeys,
            data,
            index ?? 0
        );

        setEditorModels(models.editorModels);
        setDataModels(models.dataModels);
    };

    const onSubmit = useCallback((): void => {
        const gridDataAllTabs = [];
        dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(
                dataModels,
                editorModels,
                idField,
                readOnlyColumns,
                selectionData,
                ind
            );
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            setIsSubmitting(true);
            updateAllTabRows(gridDataAllTabs).then(result => {
                setIsSubmitting(false);
                if (result !== false) {
                    onComplete();
                }
            });
        } else {
            setIsSubmitting(false);
            onComplete();
        }
    }, [dataModels, editorModels, onComplete]);

    const getCurrentTab = useCallback(
        (tabInd: number): number => {
            return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
        },
        [includedTabs]
    );

    const removeParentType = useCallback(
        (index: number, queryName: string): void => {
            const tabIndex = includedTabs.indexOf(UpdateGridTab.Lineage);

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

            setEditorModels(updatedModels.editorModels);
            setDataModels(updatedModels.dataModels);
            setEntityParentsMap(entityParents);
        },
        [includedTabs, entityParentsMap, dataModels, editorModels]
    );

    const changeParentType = useCallback(
        (index: number, queryName: string, fieldName: string, formValue: any, parent: IParentOption): void => {
            const tabIndex = includedTabs.indexOf(UpdateGridTab.Lineage);

            const { editorModelChanges, data, queryInfo, entityParents } = changeEntityParentType(
                index,
                queryName,
                parent,
                editorModels[tabIndex],
                dataModels[tabIndex],
                entityParentsMap,
                targetEntityDataType,
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

            setEditorModels(updatedModels.editorModels);
            setDataModels(updatedModels.dataModels);
            setEntityParentsMap(entityParents);
        },
        [targetEntityDataType, combineParentTypes, includedTabs, entityParentsMap, editorModels, dataModels]
    );

    const addParentType = useCallback(
        (queryName: string): void => {
            setEntityParentsMap(addEntityParentType(queryName, entityParentsMap));
        },
        [entityParentsMap]
    );

    const _getTabHeader = useCallback(
        (tabInd: number): ReactNode => {
            const currentTab = getCurrentTab(tabInd);

            if (currentTab === UpdateGridTab.Lineage) {
                return (
                    <>
                        <div className="top-spacing">
                            <EntityParentTypeSelectors
                                parentDataTypes={parentDataTypes}
                                parentOptionsMap={parentTypeOptions}
                                entityParentsMap={entityParentsMap}
                                combineParentTypes={combineParentTypes}
                                onAdd={addParentType}
                                onChange={changeParentType}
                                onRemove={removeParentType}
                            />
                        </div>
                        {getParentTypeWarning?.()}
                        <hr />
                    </>
                );
            }

            return getTabHeader?.(currentTab);
        },
        [
            getCurrentTab,
            getTabHeader,
            parentDataTypes,
            parentTypeOptions,
            entityParentsMap,
            combineParentTypes,
            addParentType,
            changeParentType,
            removeParentType,
            getParentTypeWarning,
        ]
    );

    if (!dataModels || dataModels.length < 1 || !dataModels.every(dataModel => !dataModel.isLoading)) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <EditableGridPanel
                bordered
                bsStyle="info"
                striped
                title={`Edit selected ${pluralNoun}`}
                {...gridProps}
                allowAdd={false}
                allowRemove={false}
                editorModel={editorModels}
                forUpdate
                getTabHeader={_getTabHeader}
                model={dataModels}
                onChange={onGridChange}
                readOnlyColumns={readOnlyColumns}
            />
            <WizardNavButtons
                cancel={onCancel}
                nextStep={onSubmit}
                finish={true}
                isFinishing={isSubmitting}
                isFinishingText="Updating..."
                isFinishedText="Finished Updating"
                finishText={
                    'Finish Updating ' +
                    dataModels[0].orderedRows.length +
                    ' ' +
                    (dataModels[0].orderedRows.length === 1
                        ? capitalizeFirstChar(singularNoun ?? DEFAULT_SINGULAR_NOUN)
                        : capitalizeFirstChar(pluralNoun ?? DEFAULT_PLURAL_NOUN))
                }
            />
        </>
    );
});
