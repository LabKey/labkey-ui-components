/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { Component, FC, memo, ReactNode, useMemo } from 'react';
import { Button } from 'react-bootstrap';
import { List, Map, OrderedMap, fromJS } from 'immutable';
import { AuditBehaviorTypes, Query, Utils } from '@labkey/api';

import { Link } from 'react-router';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { PlacementType } from '../editable/Controls';

import { DATA_IMPORT_TOPIC, helpLinkNode } from '../../util/helpLinks';

import { BulkAddData, EditableColumnMetadata } from '../editable/EditableGrid';

import { DERIVATION_DATA_SCOPES } from '../domainproperties/constants';

import {
    getCurrentProductName,
    isImportWithUpdateEnabled,
    isSampleManagerEnabled,
    sampleManagerIsPrimaryApp,
} from '../../app/utils';

import { fetchDomainDetails, getDomainNamePreviews } from '../domainproperties/actions';

import { SAMPLE_STATE_COLUMN_NAME, SELECTION_KEY_TYPE } from '../samples/constants';

import { loadNameExpressionOptions } from '../settings/actions';

import { SampleStatusLegend } from '../samples/SampleStatusLegend';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { applyEditableGridChangesToModels, initEditableGridModel } from '../editable/utils';

import { EditorMode, EditorModel, EditorModelProps, IEditableGridLoader, IGridResponse } from '../editable/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SampleCreationType } from '../samples/models';
import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from '../forms/FormStep';
import { User } from '../base/models/User';
import { QueryInfo } from '../../../public/QueryInfo';
import { FileSizeLimitProps } from '../../../public/files/models';
import { capitalizeFirstChar } from '../../util/utils';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';
import { getQueryDetails, InsertOptions } from '../../query/api';
import { getSampleTypeDetails } from '../samples/actions';
import { insertColumnFilter, QueryColumn } from '../../../public/QueryColumn';
import { SelectInput } from '../forms/input/SelectInput';
import { Alert } from '../base/Alert';
import { EditableGridPanel } from '../editable/EditableGridPanel';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Progress } from '../base/Progress';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { DomainDetails } from '../domainproperties/models';
import { AppURL } from '../../url/AppURL';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { useServerContext } from '../base/ServerContext';
import { getLocation, Location } from '../../util/URL';
import { SCHEMAS } from '../../schemas';
import { isSamplesSchema } from '../samples/utils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { ENTITY_CREATION_METRIC, SampleTypeDataType } from './constants';
import {
    addEntityParentType,
    removeEntityParentType,
    EntityParentTypeSelectors,
    changeEntityParentType,
    EditorModelUpdatesWithParents,
} from './EntityParentTypeSelectors';
import { EntityInsertGridRequiredFieldAlert } from './EntityInsertGridRequiredFieldAlert';
import { getBulkCreationTypeOptions, getUniqueIdColumnMetadata } from './utils';
import { getEntityTypeData, handleEntityFileImport } from './actions';
import {
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
} from './models';

const ENTITY_GRID_ID = 'entity-insert-grid-data';
const ALIQUOT_FIELD_COLS = ['aliquotedfrom', 'name', 'description', 'samplestate'];
const ALIQUOT_NOUN_SINGULAR = 'Aliquot';
const ALIQUOT_NOUN_PLURAL = 'Aliquots';

class EntityGridLoader implements IEditableGridLoader {
    id: string;
    mode: EditorMode;
    model: EntityIdCreationModel;
    queryInfo: QueryInfo;

    constructor(model: EntityIdCreationModel, queryInfo: QueryInfo) {
        this.mode = EditorMode.Insert;
        this.model = model;
        this.queryInfo = queryInfo;
    }

    fetch(gridModel: QueryModel): Promise<IGridResponse> {
        const data = this.model.getGridValues(this.queryInfo, true);

        return Promise.resolve({
            data,
            dataIds: data.keySeq().toList(),
        });
    }
}

interface OwnProps {
    acceptedFormats?: string;
    afterEntityCreation?: (entityTypeName, filter, entityCount, actionStr, transactionAuditId?, response?) => void;
    allowedNonDomainFields?: string[];
    api?: ComponentsAPIWrapper;
    asyncSize?: number;
    // the file size cutoff to enable async import. If undefined, async is not supported
    auditBehavior?: AuditBehaviorTypes;
    canEditEntityTypeDetails?: boolean;
    combineParentTypes?: boolean;
    // Puts all parent types in one parent button. Name on the button will be the first parent type listed
    containerFilter?: Query.ContainerFilter;
    disableMerge?: boolean;
    disallowedUpdateFields?: string[];
    entityDataType: EntityDataType;
    errorNounPlural?: string; // Used if you want a different noun in error messages than on the other components
    fileImportParameters?: Record<string, any>;
    filePreviewFormats?: string;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    getFileTemplateUrl?: (queryInfo: QueryInfo, importAliases: Record<string, string>) => string;
    getIsDirty?: () => boolean;
    gridInsertOnly?: boolean;
    hideParentEntityButtons?: boolean; // Used if you have an initial parent but don't want to enable ability to change it
    importHelpLinkNode: ReactNode;
    importOnly?: boolean;
    maxEntities?: number;
    navigate?: (url: string | AppURL, replace?: boolean) => void;
    nounPlural: string;
    nounSingular: string;
    onBackgroundJobStart?: (entityTypeName, filename, jobId) => void;
    onBulkAdd?: (data: OrderedMap<string, any>) => BulkAddData;
    onCancel?: () => void;
    onChangeInsertOption?: (isMerge: boolean) => void;
    onFileChange?: (files?: string[]) => void;
    onParentChange?: (parentTypes: Map<string, List<EntityParentType>>) => void;
    onTabChange?: (tab: number) => void;
    onTargetChange?: (target: string) => void;
    originalParents?: string[];
    parentDataTypes?: List<EntityDataType>;
    saveToPipeline?: boolean;
    selectedParents?: Map<string, List<EntityParentType>>;
    selectedTab?: number;
    // selectedTarget allows controlling target from a parent component
    selectedTarget?: string;
    setIsDirty?: (isDirty: boolean) => void;
}

interface FromLocationProps {
    creationType?: SampleCreationType;
    isEditMode?: boolean;
    isItemSamples?: boolean;
    isSnapshotSelection?: boolean;
    numPerParent?: number;
    parents?: string[];
    selectionKey?: string;
    tab?: number;
    target?: any;
    user?: User;
}

type Props = FromLocationProps & OwnProps & WithFormStepsProps;

interface StateProps {
    allowUserSpecifiedNames: boolean;
    creationType: SampleCreationType;
    dataModel: QueryModel;
    editorModel: EditorModel;
    error: ReactNode;
    fieldsWarningMsg: ReactNode;
    file: File;
    importAliases: Record<string, string>;
    insertModel: EntityIdCreationModel;
    isMerge: boolean;
    isSubmitting: boolean;
    originalQueryInfo: QueryInfo;
    previewAliquotName: string;
    previewName: string;
    useAsync: boolean;
}

enum EntityInsertPanelTabs {
    First = 1,
    Second = 2,
}

export class EntityInsertPanelImpl extends Component<Props, StateProps> {
    static defaultProps = {
        numPerParent: 1,
        tab: EntityInsertPanelTabs.First,
        api: getDefaultAPIWrapper(),
    };

    private readonly capNounSingular;
    private readonly capNounPlural;
    private readonly capIdsText;
    private readonly capTypeTextSingular;
    private readonly typeTextSingular;
    private readonly typeTextPlural;
    private readonly useDeprecatedUI;

    constructor(props: Props) {
        super(props);

        this.capNounPlural = capitalizeFirstChar(props.nounPlural);
        this.capNounSingular = capitalizeFirstChar(props.nounSingular);
        this.capIdsText = this.capNounSingular + ' IDs';
        this.capTypeTextSingular = this.capNounSingular + ' Type';
        this.typeTextSingular = props.nounSingular + ' type';
        this.typeTextPlural = props.nounSingular + ' types';
        this.useDeprecatedUI = !isImportWithUpdateEnabled(); // UI prior to the support of import with update

        this.state = {
            insertModel: undefined,
            originalQueryInfo: undefined,
            importAliases: undefined,
            isSubmitting: false,
            error: undefined,
            isMerge: false,
            file: undefined,
            useAsync: false,
            fieldsWarningMsg: undefined,
            creationType: props.creationType,
            allowUserSpecifiedNames: true,
            previewName: undefined,
            previewAliquotName: undefined,
            dataModel: undefined,
            editorModel: undefined,
        };
    }

    componentDidMount(): void {
        const { selectStep, tab } = this.props;

        const tabs = this.getTabs();
        if (tab !== EntityInsertPanelTabs.First && tabs.length > 1) {
            selectStep(tab);
        }

        this.init();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (
            prevProps.entityDataType !== this.props.entityDataType ||
            prevProps.originalParents !== this.props.originalParents
        ) {
            this.init();
        }

        if ((this.props.importOnly || this.props.gridInsertOnly) && this.props.tab !== EntityInsertPanelTabs.First)
            this.props.selectStep(EntityInsertPanelTabs.First);
    }

    allowParents = (): boolean => {
        return this.props.parentDataTypes && !this.props.parentDataTypes.isEmpty();
    };

    getTabs = (): string[] => {
        const { isEditMode, importOnly, gridInsertOnly } = this.props;
        const importTabTitle = (isEditMode ? 'Update' : 'Import') + ' ' + this.capNounPlural + ' from File';
        const gridTabTitle = 'Create ' + this.capNounPlural + ' from Grid';

        if (this.useDeprecatedUI) {
            // code is written with redundancy to allow easy remove all of this.useDeprecatedUI usage
            if (importOnly) {
                return [importTabTitle];
            }

            if (gridInsertOnly) {
                return [gridTabTitle];
            }

            return [gridTabTitle, importTabTitle];
        }

        if (importOnly || isEditMode) {
            return [importTabTitle];
        }

        if (gridInsertOnly) {
            return [gridTabTitle];
        }

        return [gridTabTitle, importTabTitle];
    };

    init = async (): Promise<void> => {
        const {
            auditBehavior,
            entityDataType,
            numPerParent,
            parentDataTypes,
            parents,
            selectionKey,
            target,
            isItemSamples,
            selectedTarget,
            originalParents,
            selectedParents,
            combineParentTypes,
            isSnapshotSelection,
        } = this.props;

        const { creationType } = this.state;

        const allowParents = this.allowParents();

        // Can be set from URL or parent component
        const selected = selectedTarget ?? target;

        if (isSampleManagerEnabled()) {
            try {
                const nameIdSettings = await loadNameExpressionOptions();
                this.setState({ allowUserSpecifiedNames: nameIdSettings.allowUserSpecifiedNames });
            } catch (error) {
                this.setState({
                    error: getActionErrorMessage(
                        'There was a problem retrieving name expression options.',
                        this.typeTextPlural
                    ),
                });
            }
        }

        let { insertModel } = this.state;

        if (
            insertModel &&
            insertModel.getTargetEntityTypeValue() === selected &&
            insertModel.selectionKey === selectionKey &&
            (insertModel.originalParents === parents ||
                insertModel.originalParents === originalParents ||
                !allowParents)
        ) {
            return;
        }

        insertModel = new EntityIdCreationModel({
            auditBehavior,
            creationType,
            entityCount: 0,
            entityDataType,
            initialEntityType: selected,
            numPerParent,
            originalParents: allowParents ? parents ?? originalParents : undefined,
            selectionKey,
            isSnapshotSelection,
        });

        let parentSchemaQueries = Map<string, EntityDataType>();
        parentDataTypes?.forEach(dataType => {
            parentSchemaQueries = parentSchemaQueries.set(dataType.instanceSchemaName, dataType);
        });

        try {
            const partialModel = await getEntityTypeData(
                insertModel,
                entityDataType,
                parentSchemaQueries,
                selected,
                allowParents,
                isItemSamples,
                combineParentTypes
            );

            if (selectedParents) partialModel['entityParents'] = selectedParents;

            this.gridInit(insertModel.merge(partialModel) as EntityIdCreationModel);
        } catch {
            this.setState({
                error: getActionErrorMessage(
                    'There was a problem initializing the data for import.',
                    this.typeTextPlural
                ),
            });
        }
    };

    gridInit = (insertModel: EntityIdCreationModel): void => {
        const schemaQuery = insertModel.getSchemaQuery();
        if (schemaQuery) {
            // only query for the importAliases for Sample Types (i.e. not sources)
            if (insertModel.entityDataType.insertColumnNamePrefix === SampleTypeDataType.insertColumnNamePrefix) {
                getSampleTypeDetails(schemaQuery).then(domainDetails => {
                    this.setState(() => ({ importAliases: domainDetails.options?.get('importAliases') }));
                });
            }

            getQueryDetails(schemaQuery.toJS())
                .then(originalQueryInfo => {
                    this.setState(
                        () => ({ insertModel, originalQueryInfo }),
                        async () => {
                            getDomainNamePreviews(schemaQuery)
                                .then(previews => {
                                    if (previews?.length > 0) {
                                        this.setState(() => ({
                                            previewName: previews[0],
                                            previewAliquotName: previews.length > 1 ? previews[1] : null,
                                        }));
                                    }
                                })
                                .catch(errors => {
                                    console.error('Unable to retrieve name expression previews ', errors);
                                    this.setState(() => ({
                                        previewName: null,
                                        previewAliquotName: null,
                                    }));
                                });

                            const queryModel = new QueryModel({ id: ENTITY_GRID_ID, schemaQuery }).mutate({
                                queryInfo: this.getGridQueryInfo(),
                            });
                            const { dataModel, editorModel } = await initEditableGridModel(
                                queryModel,
                                new EditorModel({ id: ENTITY_GRID_ID }),
                                new EntityGridLoader(insertModel, queryModel.queryInfo),
                                queryModel
                            );
                            this.setState({ dataModel, editorModel });
                        }
                    );
                })
                .catch(() => {
                    this.setState({
                        insertModel: insertModel.merge({
                            isError: true,
                            errors:
                                'Problem retrieving data for ' +
                                this.typeTextSingular +
                                " '" +
                                insertModel.getTargetEntityTypeLabel() +
                                "'.",
                        }) as EntityIdCreationModel,
                    });
                });
        } else {
            this.setState(() => ({ insertModel, dataModel: undefined, editorModel: undefined }));
        }
    };

    isAliquotField = (column): boolean => {
        return (
            ALIQUOT_FIELD_COLS.indexOf(column.fieldKey.toLowerCase()) > -1 ||
            column.derivationDataScope === DERIVATION_DATA_SCOPES.CHILD_ONLY ||
            column.derivationDataScope === DERIVATION_DATA_SCOPES.ALL
        );
    };

    getAliquotCreationColumns = (allColumns: OrderedMap<string, QueryColumn>): OrderedMap<string, QueryColumn> => {
        let columns = OrderedMap<string, QueryColumn>();

        allColumns.forEach((column, key) => {
            if (this.isAliquotField(column)) {
                let col = column;
                // Aliquot name can be auto generated, regardless of sample name expression config
                if (column.fieldKey.toLowerCase() === 'name')
                    col = col.merge({
                        required: false,
                    }) as QueryColumn;
                columns = columns.set(key, col);
            }
        });
        return columns;
    };

    getGridQueryInfo = (): QueryInfo => {
        const { insertModel, originalQueryInfo, creationType } = this.state;
        const { entityDataType } = this.props;

        if (originalQueryInfo) {
            const nameIndex = Math.max(
                0,
                originalQueryInfo.columns
                    .toList()
                    .findIndex(column => column.fieldKey === entityDataType.uniqueFieldKey)
            );
            const newColumnIndex = nameIndex + insertModel.getParentCount();
            let columns = originalQueryInfo.insertColumns(
                newColumnIndex,
                insertModel.getParentColumns(entityDataType.uniqueFieldKey)
            );
            if (creationType === SampleCreationType.Aliquots) columns = this.getAliquotCreationColumns(columns);

            return originalQueryInfo.merge({ columns }) as QueryInfo;
        }
        return undefined;
    };

    changeTargetEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        const { setIsDirty, navigate } = this.props;
        const { insertModel, creationType } = this.state;

        // if creating aliquots and we change the targetEntityType, update params to get the component to re-render
        if (creationType === SampleCreationType.Aliquots && navigate) {
            setIsDirty?.(false);
            const { hash } = getLocation();
            navigate(
                new AppURL({ _baseUrl: hash.substring(1) })
                    .addParam('target', formValue)
                    .addParam('creationType', SampleCreationType.Aliquots)
            );
            return;
        }

        let updatedModel = insertModel.merge({
            targetEntityType: new EntityTypeOption(selectedOption),
            isError: false,
            errors: undefined,
        }) as EntityIdCreationModel;

        if (!selectedOption) {
            updatedModel = updatedModel.merge({
                entityParents: insertModel.getClearedEntityParents(),
            }) as EntityIdCreationModel;
        }

        this.setState(
            () => ({
                originalQueryInfo: undefined,
                importAliases: undefined,
                insertModel: updatedModel,
            }),
            () => {
                this.gridInit(updatedModel);
            }
        );

        this.props.onTargetChange?.(selectedOption?.value);
    };

    addParent = (queryName: string): void => {
        this.setState(state => ({
            insertModel: state.insertModel.merge({
                entityParents: addEntityParentType(queryName, state.insertModel.entityParents),
            }) as EntityIdCreationModel,
        }));
    };

    changeParent = (
        index: number,
        queryName: string,
        fieldName: string,
        formValue: any,
        parent: IParentOption
    ): void => {
        const { insertModel, dataModel, editorModel } = this.state;
        const { entityDataType, combineParentTypes } = this.props;

        const updates = changeEntityParentType(
            index,
            queryName,
            parent,
            editorModel,
            dataModel,
            insertModel.entityParents,
            entityDataType,
            combineParentTypes
        );

        if (updates) {
            this.updateEntityParents(updates);
        }
    };

    removeParent = (index: number, queryName: string): void => {
        const { insertModel, dataModel, editorModel } = this.state;
        const updates = removeEntityParentType(
            index,
            queryName,
            insertModel.entityParents,
            editorModel,
            dataModel.queryInfo,
            fromJS(dataModel.rows)
        );

        if (updates) {
            this.updateEntityParents(updates);
        }
    };

    updateEntityParents(updates: EditorModelUpdatesWithParents): void {
        const { dataModel, editorModel } = this.state;
        const updatedModels = applyEditableGridChangesToModels(
            [dataModel],
            [editorModel],
            updates.editorModelChanges,
            updates.queryInfo,
            List(dataModel.orderedRows),
            updates.data
        );

        this.setState(
            state => ({
                insertModel: state.insertModel.merge({
                    entityParents: updates.entityParents,
                }) as EntityIdCreationModel,
                dataModel: updatedModels.dataModels[0],
                editorModel: updatedModels.editorModels[0],
            }),
            () => {
                this.props.onParentChange?.(updates.entityParents);
            }
        );
    }

    renderParentTypesAndButtons = (): ReactNode => {
        const { insertModel } = this.state;
        const { parentDataTypes, combineParentTypes, hideParentEntityButtons } = this.props;

        if (insertModel) {
            const { isInit, targetEntityType } = insertModel;

            if (!hideParentEntityButtons && isInit && targetEntityType && parentDataTypes) {
                return (
                    <EntityParentTypeSelectors
                        parentDataTypes={parentDataTypes}
                        parentOptionsMap={insertModel.parentOptions}
                        entityParentsMap={insertModel.entityParents}
                        combineParentTypes={combineParentTypes}
                        onAdd={this.addParent}
                        onChange={this.changeParent}
                        onRemove={this.removeParent}
                    />
                );
            }
        }

        return null;
    };

    renderMergeOption = (isGrid: boolean): ReactNode => {
        const { disableMerge, user, nounPlural, isEditMode } = this.props;
        const { insertModel, allowUserSpecifiedNames, isMerge, originalQueryInfo } = this.state;

        if (isGrid) return null;

        let allowMerge =
            isEditMode &&
            !disableMerge &&
            user.hasUpdatePermission() &&
            allowUserSpecifiedNames &&
            originalQueryInfo?.supportMerge;

        if (this.useDeprecatedUI) allowMerge = !disableMerge && user.hasUpdatePermission();

        const entityTypeName = insertModel.getTargetEntityTypeLabel();
        if (!allowMerge || !entityTypeName) return null;

        const mergeMsg = this.useDeprecatedUI
            ? `Update data for existing ${nounPlural} during this file import`
            : `Allow new ${nounPlural}`;

        return (
            <div className={this.useDeprecatedUI ? 'margin-bottom' : 'pull-right'}>
                <input type="checkbox" checked={isMerge} onChange={this.toggleInsertOptionChange} />
                <span className="entity-mergeoption-checkbox" onClick={this.toggleInsertOptionChange}>
                    {mergeMsg}
                </span>
                &nbsp;
                <LabelHelpTip title="Import Options" placement="top">
                    {this.renderUpdateTooltipText()}
                    <p>
                        For more information on import options for {nounPlural}, see the {this.props.importHelpLinkNode}{' '}
                        documentation page.
                    </p>
                </LabelHelpTip>
            </div>
        );
    };

    renderTargetEntitySelect = (): ReactNode => {
        const { insertModel } = this.state;
        const hasTargetEntityType = insertModel?.hasTargetEntityType();

        return (
            <SelectInput
                autoValue={false}
                inputClass="col-sm-5"
                label={this.capTypeTextSingular}
                labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                name="targetEntityType"
                placeholder={'Select a ' + this.capTypeTextSingular + '...'}
                onChange={this.changeTargetEntityType}
                options={insertModel.entityTypeOptions.toArray()}
                required
                selectedOptions={hasTargetEntityType ? insertModel?.targetEntityType : undefined}
            />
        );
    };

    renderHeader = (isGrid: boolean): ReactNode => {
        const { insertModel, creationType } = this.state;

        if (!insertModel) return null;

        const hasTargetEntityType = insertModel.hasTargetEntityType();

        return (
            <>
                {insertModel.isInit &&
                    (this.useDeprecatedUI ? (
                        <>
                            {this.renderTargetEntitySelect()}
                            {this.renderMergeOption(isGrid)}
                        </>
                    ) : (
                        <div className="row">
                            <div className="col-sm-9">{this.renderTargetEntitySelect()}</div>
                            <div className="col-sm-3">{this.renderMergeOption(isGrid)}</div>
                        </div>
                    ))}
                {insertModel.isError && (
                    <Alert>
                        {insertModel.errors ??
                            'Something went wrong loading the data for this page.  Please try again.'}
                    </Alert>
                )}
                {!insertModel.isError &&
                    isGrid &&
                    hasTargetEntityType &&
                    creationType !== SampleCreationType.Aliquots &&
                    this.renderParentTypesAndButtons()}
                {!insertModel.isError &&
                    isGrid &&
                    creationType === SampleCreationType.Aliquots &&
                    this.renderAliquotResetMsg()}
            </>
        );
    };

    resetCreationType = (): void => {
        this.setState(
            () => ({
                creationType: SampleCreationType.Independents,
            }),
            () => {
                this.changeTargetEntityType(null, null, null);
                this.props.setIsDirty?.(false);
            }
        );
    };

    renderAliquotResetMsg = (): ReactNode => {
        return (
            <Alert bsStyle="info" className="notification-container">
                Parent {sampleManagerIsPrimaryApp() ? 'and source' : ''} types cannot be changed when creating aliquots.{' '}
                <a className="pull-right" onClick={this.resetCreationType}>
                    Clear Aliquots and Reset.
                </a>
            </Alert>
        );
    };

    onGridChange = (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>
    ): void => {
        this.setState(
            state => {
                const { dataModel, editorModel, insertModel } = state;
                const updatedModels = applyEditableGridChangesToModels(
                    [dataModel],
                    [editorModel],
                    editorModelChanges,
                    undefined,
                    dataKeys,
                    data
                );

                return {
                    insertModel: insertModel.set(
                        'entityCount',
                        updatedModels.editorModels[0].rowCount
                    ) as EntityIdCreationModel,
                    dataModel: updatedModels.dataModels[0],
                    editorModel: updatedModels.editorModels[0],
                };
            },
            () => {
                this.props.setIsDirty?.(this.state.editorModel.rowCount > 0);
            }
        );
    };

    onCancel = (): void => {
        // if cancelling, presumably they know that they want to discard changes.
        this.props.setIsDirty?.(false);

        if (this.props.onCancel) {
            this.props.onCancel();
        } else {
            const { insertModel } = this.state;
            const updatedModel = insertModel.merge({
                isError: false,
                errors: undefined,
            }) as EntityIdCreationModel;
            this.setState({ insertModel: updatedModel });
            this.gridInit(updatedModel);
        }
    };

    setSubmitting = (isSubmitting: boolean): void => {
        this.setState({ isSubmitting });
    };

    getAliquotCreationExtraColumns = (): QueryColumn[] => {
        const { originalQueryInfo } = this.state;

        const requiredProperties = [];
        originalQueryInfo.columns.forEach(column => {
            if (
                column.required &&
                column.shownInInsertView &&
                !column.hidden &&
                ALIQUOT_FIELD_COLS.indexOf(column.fieldKey.toLowerCase()) === -1
            ) {
                requiredProperties.push(column);
            }
        });

        return requiredProperties;
    };

    insertRowsFromGrid = async (): Promise<void> => {
        const { insertModel, creationType, editorModel, dataModel } = this.state;
        const { api, entityDataType, nounPlural } = this.props;

        if (!editorModel) {
            this.setState(state => ({
                dataModel: state.dataModel.mutate({
                    rowsError: 'Grid does not expose an editor. Ensure the grid is properly initialized for editing.',
                }),
            }));
            return;
        }

        const errors = editorModel.getValidationErrors(dataModel, entityDataType.uniqueFieldKey);
        if (errors.length > 0) {
            this.setSubmitting(false);
            this.setState(state => ({
                dataModel: state.dataModel.mutate({ rowsError: errors.join('  ') }),
            }));
            return;
        }

        this.setSubmitting(true);

        let extraColumnsToInclude: QueryColumn[];
        if (creationType === SampleCreationType.Aliquots) {
            extraColumnsToInclude = this.getAliquotCreationExtraColumns(); // include required sample property fields in post
        }

        try {
            const response = await insertModel.postEntityGrid(dataModel, editorModel, extraColumnsToInclude);

            this.setSubmitting(false);

            if (response?.rows) {
                api.query.incrementClientSideMetricCount(ENTITY_CREATION_METRIC, nounPlural + 'CreationFromGrid');
                this.props.setIsDirty?.(false);
                this.props.afterEntityCreation?.(
                    insertModel.getTargetEntityTypeLabel(),
                    response.getFilter(),
                    response.rows.length,
                    'created',
                    response.transactionAuditId
                );
            } else {
                this.setState(state => ({
                    dataModel: state.dataModel.mutate({
                        rowsError: 'Insert response has unexpected format. No "rows" available.',
                    }),
                }));
            }
        } catch (error) {
            this.setSubmitting(false);
            this.setState(state => ({
                dataModel: state.dataModel.mutate({ rowsError: resolveErrorMessage(error.error, nounPlural) }),
            }));
        }
    };

    isNameRequired = (): boolean => {
        const { dataModel } = this.state;
        return !!dataModel?.queryInfo.isRequiredColumn(this.props.entityDataType.uniqueFieldKey);
    };

    renderGridButtons = (): ReactNode => {
        const { insertModel, isSubmitting, creationType, editorModel } = this.state;
        if (insertModel?.isInit) {
            const isAliquotCreation = creationType === SampleCreationType.Aliquots;

            const nounSingle = isAliquotCreation ? capitalizeFirstChar(ALIQUOT_NOUN_SINGULAR) : this.capNounSingular;
            const nounPlural = isAliquotCreation ? capitalizeFirstChar(ALIQUOT_NOUN_PLURAL) : this.capNounPlural;
            const noun = insertModel.entityCount === 1 ? nounSingle : nounPlural;

            return (
                <div className="form-group no-margin-bottom">
                    <div className="pull-left">
                        <Button className="test-loc-cancel-button" onClick={this.onCancel}>
                            Cancel
                        </Button>
                    </div>
                    <div className="btn-group pull-right">
                        <Button
                            className="test-loc-submit-button"
                            bsStyle="success"
                            disabled={isSubmitting || insertModel.entityCount === 0 || !editorModel}
                            onClick={this.insertRowsFromGrid}
                        >
                            {isSubmitting ? 'Creating...' : 'Finish Creating ' + insertModel.entityCount + ' ' + noun}
                        </Button>
                    </div>
                </div>
            );
        }
        return null;
    };

    getBulkAddFormValues = (): Record<string, any> | null => {
        const { insertModel, dataModel } = this.state;
        if (!dataModel || !dataModel.queryInfo) return null;

        // format/process parent column and values, for now, only parents are populated
        const allRows = insertModel.getGridValues(dataModel.queryInfo, false);

        if (allRows.size > 0) {
            let valueMap = Map<string, any>();
            let values = '';
            let sep = '';
            const row = allRows.get(0); // for insert, use the first (and only) row data
            row.keySeq().forEach(col => {
                // If >1 parents selected, skip for Aliquots as a single parent is allowed
                if (col === 'AliquotedFrom' && row.get(col).size > 1) return;

                // for some reason selectinput errors out if values are supplied as array
                row.get(col).forEach(val => {
                    values = values + sep + val.value;
                    sep = ',';
                });
                valueMap = valueMap.set(col, values);
            });
            return valueMap.toObject();
        }

        return null;
    };

    onTabChange = (tab: number): void => {
        this.props.onTabChange?.(tab);
        this.setState({ error: undefined });
    };

    isIncludedColumn = (column: QueryColumn): boolean => {
        const { creationType } = this.state;

        if (creationType === SampleCreationType.Aliquots) return this.isAliquotField(column);
        return column.derivationDataScope !== DERIVATION_DATA_SCOPES.CHILD_ONLY;
    };

    getInsertColumns = (): List<QueryColumn> => {
        const { queryInfo } = this.state.dataModel;
        let columns: List<QueryColumn> = queryInfo.getInsertColumns().filter(this.isIncludedColumn).toList();
        // we add the UniqueId columns, which will be displayed as read-only fields
        columns = columns.concat(queryInfo.getUniqueIdColumns()).toList();
        return columns;
    };

    columnFilter = (col: QueryColumn): boolean => {
        return (
            insertColumnFilter(col, false) &&
            col.fieldKey !== this.props.entityDataType.uniqueFieldKey &&
            this.isIncludedColumn(col)
        );
    };

    getColumnMetadata(): Map<string, EditableColumnMetadata> {
        const { entityDataType, nounSingular, nounPlural } = this.props;
        const { creationType, previewName, previewAliquotName } = this.state;
        let columnMetadata = getUniqueIdColumnMetadata(this.getGridQueryInfo());
        if (creationType === SampleCreationType.Aliquots) {
            let toolTip =
                "A generated Aliquot ID will be provided for Aliquots that don't have a user-provided ID in the grid.";
            if (previewAliquotName)
                toolTip +=
                    ' Example aliquot name that will be generated from the current pattern: ' + previewAliquotName;
            else
                toolTip +=
                    ' For example, if the original sample is S1, aliquots of that sample will be named S1-1, S1-2, etc.';

            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                caption: 'Aliquot ID',
                readOnly: false,
                placeholder: '[generated id]',
                toolTip,
                hideTitleTooltip: true,
            });
        } else if (!this.isNameRequired()) {
            let toolTip = `A generated ${nounSingular} ID will be provided for ${nounPlural} that don't have a user-provided ID in the grid.`;
            if (previewName) toolTip += ' Example name that will be generated from the current pattern: ' + previewName;
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                readOnly: false,
                placeholder: '[generated id]',
                toolTip,
                hideTitleTooltip: true,
            });
        } else {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                hideTitleTooltip: true,
                toolTip: `A ${nounSingular} ID is required for each ${nounSingular} since this ${this.typeTextSingular} has no naming pattern. You can provide a naming pattern by editing the ${this.typeTextSingular} design.`,
            });
        }

        columnMetadata = columnMetadata.set(SAMPLE_STATE_COLUMN_NAME, {
            hideTitleTooltip: true,
            toolTip: <SampleStatusLegend />,
            popoverClassName: 'label-help-arrow-left',
        });

        return columnMetadata;
    }

    renderCreateFromGrid = (): ReactNode => {
        const { insertModel, creationType, dataModel, editorModel } = this.state;
        const { containerFilter, maxEntities, nounPlural, onBulkAdd, getIsDirty, setIsDirty } = this.props;
        const columnMetadata = this.getColumnMetadata();
        const isLoaded = (dataModel && !dataModel?.isLoading) ?? false;

        const isAliquotCreation = creationType === SampleCreationType.Aliquots;
        const gridNounSingularCap = isAliquotCreation
            ? capitalizeFirstChar(ALIQUOT_NOUN_SINGULAR)
            : this.capNounSingular;
        const gridNounPluralCap = isAliquotCreation ? capitalizeFirstChar(ALIQUOT_NOUN_PLURAL) : this.capNounPlural;
        const gridNounPlural = isAliquotCreation ? ALIQUOT_NOUN_PLURAL : nounPlural;

        // Issue 45483: allowed creation types in bulk insert modal to be based on if sample parent types exist and based on the creation type for the page
        const numSampleParentTypes = insertModel.entityParents
            ?.get(SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName)
            ?.filter(parentType => isSamplesSchema(SchemaQuery.create(parentType.schema, parentType.query))).size;
        const bulkCreationTypeOptions = getBulkCreationTypeOptions(numSampleParentTypes > 0, creationType);

        return (
            <>
                {this.renderHeader(true)}
                <hr />
                <div className="top-spacing">
                    {!isLoaded && !insertModel.isError && !!insertModel.targetEntityType?.value && (
                        <LoadingSpinner wrapperClassName="loading-data-message" />
                    )}
                    {isLoaded && (
                        <>
                            <EntityInsertGridRequiredFieldAlert
                                type={this.capTypeTextSingular}
                                queryInfo={dataModel?.queryInfo}
                            />
                            <EditableGridPanel
                                addControlProps={{
                                    nounSingular: gridNounSingularCap,
                                    nounPlural: gridNounPluralCap,
                                    placement: 'top' as PlacementType,
                                    wrapperClass: 'pull-left',
                                    maxCount: MAX_EDITABLE_GRID_ROWS,
                                }}
                                allowBulkRemove
                                allowBulkAdd
                                allowBulkUpdate
                                bordered
                                striped
                                bulkAddText="Bulk Insert"
                                bulkAddProps={{
                                    title: `Bulk Creation of ${gridNounPluralCap}`,
                                    header: `Add a batch of ${gridNounPlural} that will share the properties set below.`,
                                    columnFilter: this.columnFilter,
                                    fieldValues: this.getBulkAddFormValues(),
                                    creationTypeOptions: bulkCreationTypeOptions,
                                    countText: `New ${gridNounPlural}`,
                                }}
                                bulkUpdateProps={{ columnFilter: this.columnFilter }}
                                bulkRemoveText={'Remove ' + gridNounPluralCap}
                                columnMetadata={columnMetadata}
                                containerFilter={containerFilter}
                                editorModel={editorModel}
                                emptyGridMsg={`Start by adding the quantity of ${gridNounPlural} you want to create.`}
                                insertColumns={this.getInsertColumns()}
                                maxRows={maxEntities}
                                model={dataModel}
                                onChange={this.onGridChange}
                                processBulkData={onBulkAdd}
                                exportColFilter={this.isIncludedColumn}
                                getIsDirty={getIsDirty}
                                setIsDirty={setIsDirty}
                            />
                        </>
                    )}
                </div>
            </>
        );
    };

    renderUpdateTooltipTextDeprecated = (): ReactNode => {
        const { nounPlural } = this.props;
        const { allowUserSpecifiedNames } = this.state;

        if (nounPlural === 'Samples' && !allowUserSpecifiedNames) {
            return (
                <>
                    <p>
                        When "Update data for existing samples during this file import" is unchecked, import will insert
                        new samples based on the file provided. This Sample Type has been configured to not accept
                        user-defined Sample IDs or Names. Providing a Sample ID or Name column in your file will result
                        in an error.
                    </p>
                    <p>
                        When "Update data for existing samples during this file import" is checked, the Sample ID or
                        Name column must be provided. All Sample IDs or Names provided must already exist in the system.
                        Encountering a new Sample ID or Name will result in an error.
                    </p>
                </>
            );
        }

        return (
            <>
                <p>
                    By default, import will insert new {nounPlural} based on the file provided. The operation will fail
                    if there are existing {this.capIdsText} that match those being imported.
                </p>
                <p>
                    When update is selected, data will be updated for matching {this.capIdsText}, and new {nounPlural}{' '}
                    will be created for any new {this.capIdsText} provided. Data will not be changed for any columns not
                    in the imported file.
                </p>
            </>
        );
    };

    renderUpdateTooltipText = (): ReactNode => {
        const { nounPlural } = this.props;

        if (this.useDeprecatedUI) return this.renderUpdateTooltipTextDeprecated();

        return (
            <>
                <p>
                    By default, import will update existing {nounPlural} based on the file provided. The operation will
                    fail if there are new {this.capIdsText} being imported.
                </p>
                <p>
                    When the "Allow new {nounPlural}" checkbox is checked, data will be updated for matching{' '}
                    {this.capIdsText}, and new {nounPlural} will be created for any new {this.capIdsText} provided. Data
                    will not be changed for any columns not in the imported file.
                </p>
            </>
        );
    };

    toggleInsertOptionChange = (): void => {
        const { onChangeInsertOption } = this.props;

        if (onChangeInsertOption) onChangeInsertOption(!this.state.isMerge);

        this.setState(state => ({ isMerge: !state.isMerge }));
    };

    handleFileChange = (files: Map<string, File>): void => {
        const { asyncSize } = this.props;

        this.props.setIsDirty?.(files.size > 0);
        this.props.onFileChange?.(files.keySeq().toArray());

        const fileSize = files.valueSeq().first().size;
        this.setState({
            error: undefined,
            file: files.first(),
            useAsync: asyncSize && fileSize > asyncSize,
            fieldsWarningMsg: undefined,
        });
    };

    handleFileRemoval = (): void => {
        this.props.setIsDirty?.(false);
        this.props.onFileChange?.();

        this.setState({
            error: undefined,
            file: undefined,
            useAsync: false,
            fieldsWarningMsg: undefined,
        });
    };

    submitFileHandler = async (): Promise<void> => {
        const {
            api,
            fileImportParameters,
            nounPlural,
            errorNounPlural,
            entityDataType,
            setIsDirty,
            onBackgroundJobStart,
            afterEntityCreation,
            saveToPipeline,
            isEditMode,
        } = this.props;
        const { insertModel, file, isMerge, originalQueryInfo, useAsync } = this.state;

        this.setSubmitting(true);
        let importOption = isEditMode ? (isMerge ? InsertOptions.MERGE : InsertOptions.UPDATE) : InsertOptions.IMPORT;

        if (this.useDeprecatedUI) {
            if (isMerge) importOption = InsertOptions.MERGE;
        }

        try {
            const response = await handleEntityFileImport(
                entityDataType.importFileAction,
                originalQueryInfo,
                file,
                importOption,
                useAsync,
                fileImportParameters,
                entityDataType.importFileController,
                saveToPipeline
            );

            this.setSubmitting(false);
            api.query.incrementClientSideMetricCount(
                ENTITY_CREATION_METRIC,
                nounPlural + 'FileImport' + (isMerge ? 'WithMerge' : 'WithoutMerge')
            );
            setIsDirty?.(false);

            if (useAsync) {
                onBackgroundJobStart?.(insertModel.getTargetEntityTypeLabel(), file.name, response.jobId);
            } else {
                afterEntityCreation?.(
                    insertModel.getTargetEntityTypeLabel(),
                    null,
                    response.rowCount,
                    'imported',
                    response.transactionAuditId,
                    response
                );
            }
        } catch (error) {
            this.setState({
                error: resolveErrorMessage(
                    error,
                    errorNounPlural ?? nounPlural,
                    errorNounPlural ?? nounPlural,
                    'importing'
                ),
                isSubmitting: false,
            });
        }
    };

    getTemplateUrl = (): string => {
        const { getFileTemplateUrl } = this.props;
        const { originalQueryInfo, importAliases } = this.state;
        if (getFileTemplateUrl && originalQueryInfo) {
            return getFileTemplateUrl(originalQueryInfo, importAliases);
        }

        return originalQueryInfo &&
            Utils.isArray(originalQueryInfo.importTemplates) &&
            originalQueryInfo.importTemplates[0]
            ? originalQueryInfo.importTemplates[0].url
            : undefined;
    };

    isGridStep = (): boolean => {
        if (this.useDeprecatedUI)
            return this.props.currentStep === EntityInsertPanelTabs.First && !this.props.importOnly;

        return (
            this.props.currentStep === EntityInsertPanelTabs.First && !this.props.importOnly && !this.props.isEditMode
        );
    };

    renderProgress = (): ReactNode => {
        const { insertModel, isSubmitting, file } = this.state;

        return this.isGridStep() ? (
            <Progress
                estimate={insertModel.entityCount * 20}
                modal
                title={'Generating ' + this.props.nounPlural}
                toggle={isSubmitting}
            />
        ) : (
            <Progress
                estimate={file ? file.size * 0.1 : undefined}
                modal
                title={'Importing ' + this.props.nounPlural + ' from file'}
                toggle={isSubmitting}
            />
        );
    };

    static getWarningFieldList(names: string[]): ReactNode {
        const oxfordComma = names.length > 2 ? ',' : '';
        return names.map((name, index) => (
            <span key={name}>
                <b>{name}</b>
                {index === names.length - 2 ? oxfordComma + ' and ' : index < names.length - 2 ? ', ' : ''}
            </span>
        ));
    }

    static getInferredFieldWarnings(
        inferred: InferDomainResponse,
        domainDetails: DomainDetails,
        columns: OrderedMap<string, QueryColumn>,
        otherAllowedFields?: string[],
        disallowedUpdateFields?: string[]
    ): React.ReactNode[] {
        const uniqueIdFields = [];
        const unknownFields = [],
            noUpdateFields = [];
        const { domainDesign } = domainDetails;
        let allowedFields = [],
            lcDisallowedUdateFields = [];
        if (domainDetails.options.has('importAliases')) {
            allowedFields = Object.keys(domainDetails.options.get('importAliases')).map(key => key.toLowerCase());
        }
        if (otherAllowedFields) {
            allowedFields = allowedFields.concat(otherAllowedFields.map(field => field.toLowerCase()));
        }
        if (disallowedUpdateFields) {
            lcDisallowedUdateFields = disallowedUpdateFields.map(field => field.toLowerCase());
        }

        inferred.fields.forEach(field => {
            const lcName = field.name.toLowerCase();

            if (lcDisallowedUdateFields.indexOf(lcName) >= 0) {
                noUpdateFields.push(field.name);
            }

            if (!field.isExpInput(false) && allowedFields.indexOf(lcName) < 0) {
                const aliasField = domainDesign.fields.find(
                    domainField => domainField.importAliases?.toLowerCase().indexOf(lcName) >= 0
                );
                const columnName = aliasField ? aliasField.name : field.name;
                const column = columns.find(column => column.isImportColumn(columnName));

                if (!column) {
                    if (unknownFields.indexOf(field.name) < 0) {
                        unknownFields.push(field.name);
                    }
                } else if (column.isUniqueIdColumn) {
                    if (uniqueIdFields.indexOf(field.name) < 0) {
                        // duplicate fields are handled as errors during import; we do not issue warnings about that here.
                        uniqueIdFields.push(field.name);
                    }
                }
            }
        });

        const msg = [];
        if (noUpdateFields.length > 0) {
            msg.push(
                <p key="noUpdateFields">
                    {EntityInsertPanelImpl.getWarningFieldList(noUpdateFields)}
                    {' cannot be updated and and will be ignored.'}
                </p>
            );
        }

        if (unknownFields.length > 0) {
            msg.push(
                <p key="unknownFields">
                    {EntityInsertPanelImpl.getWarningFieldList(unknownFields)}
                    {(unknownFields.length === 1 ? ' is an unknown field' : ' are unknown fields') +
                        ' and will be ignored.'}
                </p>
            );
        }
        if (uniqueIdFields.length > 0) {
            msg.push(
                <p key="uniqueIdFields">
                    {EntityInsertPanelImpl.getWarningFieldList(uniqueIdFields)}
                    {(uniqueIdFields.length === 1 ? ' is a unique ID field. It' : ' are unique ID fields. They') +
                        ' will not be imported and will be managed by ' +
                        getCurrentProductName() +
                        '.'}
                </p>
            );
        }
        return msg;
    }

    onPreviewLoad = (inferred: InferDomainResponse): any => {
        const { allowedNonDomainFields, disallowedUpdateFields, isEditMode } = this.props;
        const { insertModel, originalQueryInfo } = this.state;
        fetchDomainDetails(undefined, insertModel.getSchemaQuery().schemaName, insertModel.getSchemaQuery().queryName)
            .then(domainDetails => {
                const msg = EntityInsertPanelImpl.getInferredFieldWarnings(
                    inferred,
                    domainDetails,
                    originalQueryInfo.columns,
                    allowedNonDomainFields,
                    isEditMode ? disallowedUpdateFields : undefined
                );

                if (msg.length > 0) {
                    this.setState({ fieldsWarningMsg: <>{msg}</> });
                }
            })
            .catch(reason => {
                console.error('Unable to retrieve domain ', reason);
            });
    };

    shouldShowGrid = (): boolean => {
        const { importOnly, isEditMode } = this.props;

        if (this.useDeprecatedUI) return !importOnly;

        return !importOnly && !isEditMode;
    };

    render() {
        const {
            acceptedFormats,
            canEditEntityTypeDetails,
            fileSizeLimits,
            entityDataType,
            filePreviewFormats,
            gridInsertOnly,
        } = this.props;
        const { error, file, insertModel, isSubmitting, originalQueryInfo } = this.state;

        if (!insertModel) {
            if (error) {
                return <Alert>{error}</Alert>;
            } else {
                return <LoadingSpinner wrapperClassName="loading-data-message" />;
            }
        }

        const isGridStep = this.isGridStep();
        const entityTypeName = insertModel.getTargetEntityTypeLabel();
        const isFromSharedContainer = insertModel.isFromSharedContainer();

        const editEntityTypeDetailsLink =
            entityTypeName && entityDataType?.editTypeAppUrlPrefix && !isFromSharedContainer
                ? AppURL.create(entityDataType.editTypeAppUrlPrefix, entityTypeName)
                : undefined;

        const showGrid = this.shouldShowGrid();

        return (
            <>
                <div className="panel panel-default">
                    <div className="panel-body">
                        <div className="row">
                            <div className="import-panel col-sm-7">
                                <FormTabs tabs={this.getTabs()} onTabChange={this.onTabChange} />
                            </div>
                            {canEditEntityTypeDetails && !!editEntityTypeDetailsLink && (
                                <div className="col-sm-5">
                                    <Link
                                        className="pull-right entity-insert--link"
                                        to={editEntityTypeDetailsLink.toString()}
                                    >
                                        Edit {this.capTypeTextSingular} Design
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                {showGrid && (
                                    <FormStep stepIndex={EntityInsertPanelTabs.First}>
                                        {this.renderCreateFromGrid()}
                                    </FormStep>
                                )}
                                {!gridInsertOnly && (
                                    <FormStep
                                        stepIndex={
                                            showGrid ? EntityInsertPanelTabs.Second : EntityInsertPanelTabs.First
                                        }
                                    >
                                        {this.renderHeader(false)}
                                        {entityTypeName && (
                                            <FileAttachmentForm
                                                showLabel={false}
                                                acceptedFormats={acceptedFormats ?? '.csv, .tsv, .txt, .xls, .xlsx'}
                                                allowMultiple={false}
                                                allowDirectories={false}
                                                previewGridProps={{
                                                    previewCount: 3,
                                                    onPreviewLoad: this.onPreviewLoad,
                                                    warningMsg: this.state.fieldsWarningMsg,
                                                    acceptedFormats: filePreviewFormats,
                                                }}
                                                onFileChange={this.handleFileChange}
                                                onFileRemoval={this.handleFileRemoval}
                                                templateUrl={this.getTemplateUrl()}
                                                sizeLimits={fileSizeLimits}
                                                sizeLimitsHelpText={
                                                    <>
                                                        We recommend dividing your data into smaller files that meet
                                                        this limit. See our{' '}
                                                        {helpLinkNode(DATA_IMPORT_TOPIC, 'help article')} for best
                                                        practices on data import.
                                                    </>
                                                }
                                            />
                                        )}
                                    </FormStep>
                                )}
                            </div>
                        </div>
                        <Alert>{error}</Alert>
                    </div>
                </div>
                {isGridStep && insertModel?.isInit && this.renderGridButtons()}
                {!isGridStep && (
                    <WizardNavButtons
                        cancel={this.onCancel}
                        containerClassName="test-loc-import-btn"
                        canFinish={file !== undefined && originalQueryInfo !== undefined}
                        finish
                        nextStep={this.submitFileHandler} // nextStep is the function that will get called when finish button clicked
                        isFinishing={isSubmitting}
                        finishText="Import"
                        isFinishingText="Importing..."
                    />
                )}
                {this.renderProgress()}
            </>
        );
    }
}

const EntityInsertPanelFormSteps = withFormSteps(EntityInsertPanelImpl, {
    currentStep: EntityInsertPanelTabs.First,
    furthestStep: EntityInsertPanelTabs.Second,
    hasDependentSteps: false,
});

// ideally this would move to the /entities subpackage, but it is used in the core-components.view page
export const EntityInsertPanel: FC<{ location?: Location } & OwnProps> = memo(props => {
    const { location, ...entityInsertPanelProps } = props;
    const { user } = useServerContext();

    const fromLocationProps = useMemo<FromLocationProps>(() => {
        if (!location) {
            return {};
        }

        const {
            creationType = SampleCreationType.Independents,
            numPerParent,
            parent,
            selectionKey,
            tab,
            target,
            selectionKeyType,
            mode,
        } = location.query;
        const isItemSamples = selectionKeyType === SELECTION_KEY_TYPE.inventoryItems;
        const isSnapshotSelection = selectionKeyType === SELECTION_KEY_TYPE.snapshot;
        const isEditMode = mode?.toLowerCase() === 'update';
        return {
            creationType,
            numPerParent,
            parents: parent?.split(';'),
            selectionKey,
            tab: entityInsertPanelProps.selectedTab ?? parseInt(tab, 10),
            target,
            isItemSamples,
            isSnapshotSelection,
            isEditMode,
        };
    }, [location, entityInsertPanelProps.selectedTab]);

    // Issue 46163: changing aliquot target entity type should reload the EntityInsertPanel component to re-init accordingly
    const key = useMemo(
        () => fromLocationProps.target + '-' + fromLocationProps.creationType,
        [fromLocationProps.creationType, fromLocationProps.target]
    );

    return <EntityInsertPanelFormSteps {...entityInsertPanelProps} {...fromLocationProps} key={key} user={user} />;
});

EntityInsertPanel.displayName = 'EntityInsertPanel';
