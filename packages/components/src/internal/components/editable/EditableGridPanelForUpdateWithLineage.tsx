import React, {FC, memo, ReactNode, useCallback, useEffect, useState} from 'react';
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
    WizardNavButtons,
} from '../../../index';
import { capitalizeFirstChar } from '../../util/utils';

import {
    applyEditableGridChangesToModels,
    getUpdatedDataFromEditableGrid,
    initEditableGridModels,
} from './utils';
import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';
import { EntityParentType } from '../entities/models';

export enum UpdateGridTab {
    Samples,
    DataClasses,
    Storage,
    Lineage,
}

const DEFAULT_SINGULAR_NOUN = 'row';
const DEFAULT_PLURAL_NOUN = 'rows';

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
    includedTabs: UpdateGridTab[];
    getColumnMetadata: (tabInd: number) => Map<string, EditableColumnMetadata>;
    getTabTitle: (tabInd: number) => string;
    getAdditionalTabInfo?: (tab: number) => ReactNode
    targetEntityDataType: EntityDataType
    getParentTypeWarning?: () => ReactNode
    getReadOnlyRows?: (tabInd: number) => List<string>

    // passed through from SampleEditableGrid
    parentDataTypes: List<EntityDataType>;
    combineParentTypes?: boolean;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}

// See note in onGridChange
let editableGridUpdateAggregate: Partial<EditorModelProps> = undefined;

export const EditableGridPanelForUpdateWithLineage: FC<Props> = memo(props => {
    const { loaders, queryModel, parentDataTypes, onComplete, updateAllTabRows, idField, readOnlyColumns, selectionData,
        getColumnMetadata, includedTabs, getTabTitle, combineParentTypes, parentTypeOptions, getAdditionalTabInfo, targetEntityDataType,
        getParentTypeWarning, pluralNoun, singularNoun, getReadOnlyRows, onCancel } = props;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [dataModels, setDataModels] = useState<QueryModel[]>()
    const [editorModels, setEditorModels] = useState<EditorModel[]>()
    const [entityParentsMap, setEntityParentsMap] = useState<Map<string, List<EntityParentType>>>()

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
        setEntityParentsMap(fromJS(
            parentDataTypes.reduce((map, dataType) => {
                map[dataType.typeListingSchemaQuery.queryName] = [];
                return map;
            }, {})));

    }, [loaders, parentDataTypes]); // TODO: empty dependencies?

    const initEditorModel = useCallback(async (): Promise<void> => {
        const models = await initEditableGridModels(
            dataModels,
            editorModels,
            queryModel,
            loaders
        );

        setDataModels(models.dataModels);
        setEditorModels(models.editorModels);
    },[dataModels, editorModels]);

    useEffect(() => {
        if (loaders && dataModels?.find(dataModel => dataModel.isLoading))
            initEditorModel().then();
    }, [loaders, dataModels]);

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
        // This doesn't allow state to be set between onChange events for a single browser event, thus this goes outside
        // the normal functional component life-cycle to aggregate the onChange events between renders.
        editableGridUpdateAggregate = {...editableGridUpdateAggregate, ...editorModelChanges};

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
                    onComplete(); // TODO: add isSubmitting param?
                }
            });
        } else {
            setIsSubmitting(false);
            onComplete(); // TODO: add isSubmitting param?
        }
    }, [dataModels, editorModels, onComplete]);

    const getCurrentTab = useCallback((tabInd: number): number => {
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    }, [includedTabs]);

    const removeParentType = useCallback((index: number, queryName: string): void => {
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

    }, [includedTabs, entityParentsMap, dataModels, editorModels]);

    const changeParentType = useCallback((
        index: number,
        queryName: string,
        fieldName: string,
        formValue: any,
        parent: IParentOption
    ): void => {
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
    }, [targetEntityDataType, combineParentTypes, includedTabs, entityParentsMap, editorModels, dataModels]);

    const getTabHeader = useCallback((tabInd: number): ReactNode => {
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
        } else if (getAdditionalTabInfo) {
            return getAdditionalTabInfo(currentTab);
        }
    }, [parentDataTypes, combineParentTypes, parentTypeOptions, entityParentsMap, getCurrentTab, getAdditionalTabInfo, changeParentType, removeParentType]);

    const addParentType = useCallback((queryName: string): void => {
        setEntityParentsMap(addEntityParentType(queryName, entityParentsMap));
    }, [entityParentsMap]);

    if (!dataModels || dataModels.length < 1 || !dataModels.every(dataModel => !dataModel.isLoading)) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <EditableGridPanel
                {...props}
                allowAdd={false}
                allowRemove={false}
                bordered
                bsStyle="info"
                getColumnMetadata={getColumnMetadata}
                editorModel={editorModels}
                forUpdate
                model={dataModels}
                onChange={onGridChange}
                striped
                title={`Edit selected ${pluralNoun}`}
                getTabTitle={getTabTitle}
                getTabHeader={getTabHeader}
                getReadOnlyRows={getReadOnlyRows}
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
