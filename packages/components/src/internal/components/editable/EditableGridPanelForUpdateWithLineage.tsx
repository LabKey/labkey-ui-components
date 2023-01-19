import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { fromJS, List, Map } from 'immutable';

import { capitalizeFirstChar } from '../../util/utils';

import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';
import { EntityDataType, EntityParentType, IEntityTypeOption, IParentOption } from '../entities/models';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { useNotificationsContext } from '../notifications/NotificationsContext';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { Alert } from '../base/Alert';

import { EditorModel, EditorModelProps, IEditableGridLoader } from './models';

import { EditableGridPanel } from './EditableGridPanel';
import { SharedEditableGridPanelProps } from './EditableGrid';
import {
    applyEditableGridChangesToModels,
    EditableGridModels,
    getUpdatedDataFromEditableGrid,
    initEditableGridModels,
} from './utils';

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
    altIdField: string;
    combineParentTypes?: boolean;
    exportColFilter?: (col: QueryColumn) => boolean;
    extraExportColumns?: Array<Partial<QueryColumn>>;
    getIsDirty?: () => boolean;
    getParentTypeWarning?: () => ReactNode;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    idField: string;
    includedTabs: UpdateGridTab[];
    loaders: IEditableGridLoader[];
    onCancel: () => void;
    onComplete: () => void;
    parentDataTypes: List<EntityDataType>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    pluralNoun?: string;
    queryModel: QueryModel;
    selectionData?: Map<string, any>;
    setIsDirty?: (isDirty: boolean) => void;
    singularNoun?: string;
    targetEntityDataType: EntityDataType;
    updateAllTabRows: (updateData: any[]) => Promise<boolean>;
}

export const EditableGridPanelForUpdateWithLineage: FC<EditableGridPanelForUpdateWithLineageProps> = memo(props => {
    const {
        combineParentTypes,
        getParentTypeWarning,
        getTabHeader,
        idField,
        altIdField,
        includedTabs,
        loaders,
        onCancel,
        onComplete,
        setIsDirty,
        getIsDirty,
        parentDataTypes,
        parentTypeOptions,
        pluralNoun = DEFAULT_PLURAL_NOUN,
        queryModel,
        readOnlyColumns,
        selectionData,
        singularNoun = DEFAULT_SINGULAR_NOUN,
        targetEntityDataType,
        updateAllTabRows,
        extraExportColumns,
        ...gridProps
    } = props;
    const { createNotification } = useNotificationsContext();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [editableGridModels, setEditableGridModels] = useState<EditableGridModels>();
    const [entityParentsMap, setEntityParentsMap] = useState<Map<string, List<EntityParentType>>>();
    const [error, setError] = useState<boolean>();

    useEffect(() => {
        const dataModels = [];
        const editorModels = [];
        loaders.forEach(loader => {
            dataModels.push(new QueryModel({ id: loader.id, schemaQuery: queryModel.schemaQuery }));
            editorModels.push(new EditorModel({ id: loader.id }));
        });

        setIsSubmitting(false);
        setEditableGridModels({ dataModels, editorModels });
        setEntityParentsMap(
            fromJS(
                parentDataTypes.reduce((map, dataType) => {
                    map[dataType.typeListingSchemaQuery.queryName] = [];
                    return map;
                }, {})
            )
        );
    }, [loaders, parentDataTypes, queryModel.schemaQuery]);

    useEffect(() => {
        if (loaders && editableGridModels?.dataModels?.find(dataModel => dataModel.isLoading)) {
            (async () => {
                try {
                    const { dataModels, editorModels } = await initEditableGridModels(
                        editableGridModels.dataModels,
                        editableGridModels.editorModels,
                        loaders,
                        queryModel
                    );
                    setEditableGridModels({ dataModels, editorModels });
                } catch (e) {
                    createNotification({ alertClass: 'danger', message: e });
                }
            })();
        }
    }, [loaders, queryModel, editableGridModels, createNotification]);

    const onGridChange = useCallback(
        (
            editorModelChanges: Partial<EditorModelProps>,
            dataKeys?: List<any>,
            data?: Map<string, Map<string, any>>,
            index?: number
        ): void => {
            setEditableGridModels(_models =>
                applyEditableGridChangesToModels(
                    _models.dataModels,
                    _models.editorModels,
                    editorModelChanges,
                    undefined,
                    dataKeys,
                    data,
                    index ?? 0
                )
            );
            setIsDirty?.(true);
        },
        [setIsDirty]
    );

    const onSubmit = useCallback((): void => {
        const gridDataAllTabs = [];
        editableGridModels.dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(
                editableGridModels.dataModels,
                editableGridModels.editorModels,
                idField,
                selectionData,
                ind,
                altIdField
            );
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            setIsSubmitting(true);
            updateAllTabRows(gridDataAllTabs)
                .then(result => {
                    setIsSubmitting(false);
                    if (result !== false) {
                        onComplete();
                    }
                })
                .catch(error => {
                    setIsSubmitting(false);
                    setError(error);
                });
        } else {
            setIsSubmitting(false);
            onComplete();
        }
    }, [editableGridModels, idField, onComplete, selectionData, updateAllTabRows, altIdField]);

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
                editableGridModels.editorModels[tabIndex],
                editableGridModels.dataModels[tabIndex].queryInfo,
                fromJS(editableGridModels.dataModels[tabIndex].rows)
            );

            const updatedModels = applyEditableGridChangesToModels(
                editableGridModels.dataModels,
                editableGridModels.editorModels,
                editorModelChanges,
                queryInfo,
                List(editableGridModels.dataModels[tabIndex].orderedRows),
                data,
                tabIndex
            );

            setEditableGridModels(updatedModels);
            setEntityParentsMap(entityParents);
        },
        [includedTabs, entityParentsMap, editableGridModels]
    );

    const changeParentType = useCallback(
        (index: number, queryName: string, fieldName: string, formValue: any, parent: IParentOption): void => {
            const tabIndex = includedTabs.indexOf(UpdateGridTab.Lineage);

            const { editorModelChanges, data, queryInfo, entityParents } = changeEntityParentType(
                index,
                queryName,
                parent,
                editableGridModels.editorModels[tabIndex],
                editableGridModels.dataModels[tabIndex],
                entityParentsMap,
                targetEntityDataType,
                combineParentTypes
            );

            const updatedModels = applyEditableGridChangesToModels(
                editableGridModels.dataModels,
                editableGridModels.editorModels,
                editorModelChanges,
                queryInfo,
                List(editableGridModels.dataModels[tabIndex].orderedRows),
                data,
                tabIndex
            );

            setEditableGridModels(updatedModels);
            setEntityParentsMap(entityParents);
        },
        [targetEntityDataType, combineParentTypes, includedTabs, entityParentsMap, editableGridModels]
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

    if (
        !editableGridModels ||
        !editableGridModels.dataModels ||
        editableGridModels.dataModels.length < 1 ||
        !editableGridModels.dataModels.every(dataModel => !dataModel.isLoading)
    ) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <EditableGridPanel
                bordered
                bsStyle="info"
                striped
                title={`Edit selected ${pluralNoun}`}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
                {...gridProps}
                allowAdd={false}
                allowRemove={false}
                editorModel={editableGridModels.editorModels}
                forUpdate
                getTabHeader={_getTabHeader}
                model={editableGridModels.dataModels}
                onChange={onGridChange}
                readOnlyColumns={readOnlyColumns}
                extraExportColumns={extraExportColumns}
            />
            <Alert>{error}</Alert>
            <WizardNavButtons
                cancel={onCancel}
                nextStep={onSubmit}
                finish
                isFinishing={isSubmitting}
                isFinishingText="Updating..."
                isFinishedText="Finished Updating"
                finishText={
                    'Finish Updating ' +
                    editableGridModels.dataModels[0].orderedRows.length +
                    ' ' +
                    (editableGridModels.dataModels[0].orderedRows.length === 1
                        ? capitalizeFirstChar(singularNoun ?? DEFAULT_SINGULAR_NOUN)
                        : capitalizeFirstChar(pluralNoun ?? DEFAULT_PLURAL_NOUN))
                }
            />
        </>
    );
});

EditableGridPanelForUpdateWithLineage.defaultProps = {
    idField: 'RowId',
    altIdField: 'LSID',
};
