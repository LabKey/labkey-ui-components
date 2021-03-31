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
import { List, Map, OrderedMap } from 'immutable';
import { AuditBehaviorTypes, Utils } from '@labkey/api';

import { Link } from 'react-router';

import { IMPORT_DATA_FORM_TYPES, MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { addColumns, changeColumn, removeColumn } from '../../actions';

import {
    AddEntityButton,
    Alert,
    AppURL,
    capitalizeFirstChar,
    DomainDetails,
    EditableColumnMetadata,
    EditableGridPanel,
    FileAttachmentForm,
    FileSizeLimitProps,
    FormStep,
    FormTabs,
    generateId,
    getActionErrorMessage,
    getEditorModel,
    getQueryDetails,
    getQueryGridModel,
    getStateQueryGridModel,
    gridInit,
    gridShowError,
    helpLinkNode,
    IGridLoader,
    IGridResponse,
    InferDomainResponse,
    insertColumnFilter,
    LabelHelpTip,
    LoadingSpinner,
    Location,
    Progress,
    QueryColumn,
    queryGridInvalidate,
    QueryGridModel,
    QueryInfo,
    RemoveEntityButton,
    removeQueryGridModel,
    resolveErrorMessage,
    SampleCreationType,
    SampleCreationTypeModel,
    SchemaQuery,
    SelectInput,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons,
} from '../../..';

import { PlacementType } from '../editable/Controls';

import { DATA_IMPORT_TOPIC } from '../../util/helpLinks';

import { BulkAddData } from '../editable/EditableGrid';

import { DERIVATION_DATA_SCOPE_CHILD_ONLY } from '../domainproperties/constants';

import {
    EntityDataType,
    EntityIdCreationModel,
    EntityInsertPanelTabs,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
} from './models';

import { getUniqueIdColumnMetadata } from './utils';
import { getCurrentProductName } from '../../app/utils';
import { getEntityTypeData, handleEntityFileImport } from './actions';
import { fetchDomainDetails } from '../domainproperties/actions';

class EntityGridLoader implements IGridLoader {
    model: EntityIdCreationModel;

    constructor(model: EntityIdCreationModel) {
        this.model = model;
    }

    fetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        const data = this.model.getGridValues(gridModel.queryInfo, true);

        return Promise.resolve({
            data,
            dataIds: data.keySeq().toList(),
        });
    }
}

interface OwnProps {
    asyncSize?: number; // the file size cutoff to enable async import. If undefined, async is not supported
    auditBehavior?: AuditBehaviorTypes;
    afterEntityCreation?: (entityTypeName, filter, entityCount, actionStr, transactionAuditId?) => void;
    allowedNonDomainFields?: string[];
    canEditEntityTypeDetails?: boolean;
    combineParentTypes?: boolean; // Puts all parent types in one parent button. Name on the button will be the first parent type listed
    creationTypeOptions?: SampleCreationTypeModel[];
    disableMerge?: boolean;
    entityDataType: EntityDataType;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    getFileTemplateUrl?: (queryInfo: QueryInfo) => string;
    fileImportParameters: Record<string, any>;
    importHelpLinkNode: ReactNode;
    importOnly?: boolean;
    maxEntities?: number;
    nounPlural: string;
    nounSingular: string;
    onBackgroundJobStart?: (entityTypeName, filename, jobId) => void;
    onBulkAdd?: (data: OrderedMap<string, any>) => BulkAddData;
    onCancel?: () => void;
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => void;
    onParentChange?: (parentTypes: Map<string, List<EntityParentType>>) => void;
    parentDataTypes?: List<EntityDataType>;
}

interface FromLocationProps {
    creationType?: SampleCreationType;
    numPerParent?: number;
    parents?: string[];
    selectionKey?: string;
    tab?: number;
    target?: any;
}

type Props = FromLocationProps & OwnProps & WithFormStepsProps;

interface StateProps {
    error: ReactNode;
    file: File;
    insertModel: EntityIdCreationModel;
    isMerge: boolean;
    isSubmitting: boolean;
    originalQueryInfo: QueryInfo;
    useAsync: boolean;
    fieldsWarningMsg: ReactNode;
}

export class EntityInsertPanelImpl extends Component<Props, StateProps> {
    static defaultProps = {
        numPerParent: 1,
        tab: EntityInsertPanelTabs.First,
    };

    private readonly capNounSingular;
    private readonly capNounPlural;
    private readonly capIdsText;
    private readonly capTypeTextSingular;
    private readonly typeTextSingular;
    private readonly typeTextPlural;

    constructor(props: Props) {
        super(props);

        this.capNounPlural = capitalizeFirstChar(props.nounPlural);
        this.capNounSingular = capitalizeFirstChar(props.nounSingular);
        this.capIdsText = this.capNounSingular + ' IDs';
        this.capTypeTextSingular = this.capNounSingular + ' Type';
        this.typeTextSingular = props.nounSingular + ' type';
        this.typeTextPlural = props.nounSingular + ' types';

        this.state = {
            insertModel: undefined,
            originalQueryInfo: undefined,
            isSubmitting: false,
            error: undefined,
            isMerge: false,
            file: undefined,
            useAsync: false,
            fieldsWarningMsg: undefined,
        };
    }

    componentDidMount(): void {
        const { selectStep, tab } = this.props;

        if (tab !== EntityInsertPanelTabs.First) {
            selectStep(tab);
        }

        this.init();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.entityDataType !== this.props.entityDataType) {
            this.init();
        }
    }

    componentWillUnmount(): void {
        this.removeQueryGridModel();
    }

    removeQueryGridModel = (): void => {
        const gridModel = this.getQueryGridModel();

        if (gridModel) {
            removeQueryGridModel(gridModel);
        }
    };

    allowParents = (): boolean => {
        return this.props.parentDataTypes && !this.props.parentDataTypes.isEmpty();
    };

    getTabs = (): string[] => {
        if (this.props.importOnly) {
            return ['Import ' + this.capNounPlural + ' from File'];
        }
        return ['Create ' + this.capNounPlural + ' from Grid', 'Import ' + this.capNounPlural + ' from File'];
    };

    init = async (): Promise<void> => {
        const {
            auditBehavior,
            creationType,
            entityDataType,
            numPerParent,
            parentDataTypes,
            parents,
            selectionKey,
            target,
        } = this.props;
        const allowParents = this.allowParents();

        let { insertModel } = this.state;

        if (
            insertModel &&
            insertModel.getTargetEntityTypeValue() === target &&
            insertModel.selectionKey === selectionKey &&
            (insertModel.originalParents === parents || !allowParents)
        ) {
            return;
        }

        insertModel = new EntityIdCreationModel({
            auditBehavior,
            creationType,
            entityCount: 0,
            entityDataType,
            initialEntityType: target,
            numPerParent,
            originalParents: allowParents ? parents : undefined,
            selectionKey,
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
                entityDataType.typeListingSchemaQuery.queryName,
                allowParents
            );

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
            getQueryDetails(schemaQuery.toJS())
                .then(originalQueryInfo => {
                    this.setState(
                        () => ({ insertModel, originalQueryInfo }),
                        () => {
                            gridInit(this.getQueryGridModel(), true, this);
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
            this.setState(
                () => ({ insertModel }),
                () => {
                    gridInit(this.getQueryGridModel(), true, this);
                }
            );
        }
    };

    getQueryGridModel = (): QueryGridModel => {
        const { insertModel } = this.state;

        if (insertModel) {
            const entityTypeName = insertModel ? insertModel.getTargetEntityTypeValue() : undefined;
            if (entityTypeName) {
                const model = getStateQueryGridModel(
                    'insert-entities',
                    SchemaQuery.create(this.props.entityDataType.instanceSchemaName, entityTypeName),
                    () => ({
                        editable: true,
                        loader: new EntityGridLoader(insertModel),
                        queryInfo: this.getGridQueryInfo(),
                    })
                );

                return getQueryGridModel(model.getId()) || model;
            }
        }

        return undefined;
    };

    getGridQueryInfo = (): QueryInfo => {
        const { insertModel, originalQueryInfo } = this.state;
        const { entityDataType } = this.props;

        if (originalQueryInfo) {
            const nameIndex = Math.max(
                0,
                originalQueryInfo.columns
                    .toList()
                    .findIndex(column => column.fieldKey === entityDataType.uniqueFieldKey)
            );
            const newColumnIndex = nameIndex + insertModel.getParentCount();
            const columns = originalQueryInfo.insertColumns(
                newColumnIndex,
                insertModel.getParentColumns(entityDataType.uniqueFieldKey)
            );
            return originalQueryInfo.merge({ columns }) as QueryInfo;
        }
        return undefined;
    };

    changeTargetEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        const { insertModel } = this.state;

        // Clear previous selection model
        this.removeQueryGridModel();

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
                insertModel: updatedModel,
            }),
            () => {
                if (!selectedOption) {
                    queryGridInvalidate(insertModel.getSchemaQuery(), true);
                }
                this.gridInit(updatedModel);
            }
        );
    };

    addParent = (queryName: string): void => {
        this.setState(state => ({ insertModel: state.insertModel.addParent(queryName) }));
    };

    changeParent = (
        index: number,
        queryName: string,
        fieldName: string,
        formValue: any,
        parent: IParentOption
    ): void => {
        const { combineParentTypes } = this.props;
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {
            const { insertModel } = this.state;
            const { entityDataType } = this.props;
            const [updatedModel, column, existingParent, parentColumnName] = insertModel.changeParent(
                index,
                queryName,
                entityDataType.uniqueFieldKey,
                parent
            );
            if (!updatedModel)
                // no updated model if nothing has changed, so we can just stop
                return;

            this.setState(
                () => {
                    return {
                        insertModel: updatedModel,
                    };
                },
                () => {
                    this.props.onParentChange?.(updatedModel.entityParents);
                    if (column && existingParent) {
                        if (existingParent.query !== undefined) {
                            changeColumn(queryGridModel, existingParent.createColumnName(), column);
                        } else {
                            const columnMap = OrderedMap<string, QueryColumn>();
                            let fieldKey;
                            if (existingParent.index === 1) {
                                fieldKey = entityDataType.uniqueFieldKey;
                            } else {
                                const definedParents = updatedModel
                                    .getParentEntities(combineParentTypes, queryName)
                                    .filter(parent => parent.query !== undefined);
                                if (definedParents.size === 0) fieldKey = entityDataType.uniqueFieldKey;
                                else {
                                    // want the first defined parent before the new parent's index
                                    const prevParent = definedParents.findLast(
                                        parent => parent.index < existingParent.index
                                    );
                                    fieldKey = prevParent
                                        ? prevParent.createColumnName()
                                        : entityDataType.uniqueFieldKey;
                                }
                            }
                            addColumns(queryGridModel, columnMap.set(column.fieldKey.toLowerCase(), column), fieldKey);
                        }
                    } else {
                        removeColumn(queryGridModel, parentColumnName);
                    }
                }
            );
        }
    };

    removeParent = (index: number, queryName: string): void => {
        const { insertModel } = this.state;
        const [updatedModel, parentColumnName] = insertModel.removeParent(index, queryName);
        this.setState(
            () => ({ insertModel: updatedModel }),
            () => {
                this.props.onParentChange?.(updatedModel.entityParents);
                removeColumn(this.getQueryGridModel(), parentColumnName);
            }
        );
    };

    renderParentTypes = (entityDataType: EntityDataType): ReactNode => {
        const { insertModel } = this.state;
        const { combineParentTypes } = this.props;
        const { queryName } = entityDataType.typeListingSchemaQuery;

        return insertModel
            .getParentEntities(combineParentTypes, queryName)
            .map(parent => {
                const { index, key, query } = parent;
                const capNounSingular = capitalizeFirstChar(entityDataType.nounAsParentSingular);
                return (
                    <div className="form-group row" key={key}>
                        <SelectInput
                            formsy={false}
                            containerClass=""
                            inputClass="col-sm-5"
                            label={capNounSingular + ' ' + index + ' Type'}
                            labelClass="col-sm-3 entity-insert--parent-label"
                            name={'parent-re-select-' + index}
                            id={'parent-re-select-' + index}
                            onChange={this.changeParent.bind(this, index, queryName)}
                            options={insertModel.getParentOptions(query, queryName, combineParentTypes)}
                            value={query}
                        />

                        <RemoveEntityButton
                            labelClass="entity-insert--remove-parent"
                            entity={capNounSingular}
                            index={index}
                            onClick={this.removeParent.bind(this, index, queryName)}
                        />
                    </div>
                );
            })
            .toArray();
    };

    renderAddEntityButton = (entityDataType: EntityDataType): ReactNode => {
        const { insertModel } = this.state;
        const { combineParentTypes } = this.props;
        const { queryName } = entityDataType.typeListingSchemaQuery;
        const parentOptions = insertModel.parentOptions.get(queryName);

        if (parentOptions.size === 0) {
            return null;
        }

        const entityParents = insertModel.getParentEntities(combineParentTypes, queryName);
        const disabled = parentOptions.size <= entityParents.size;
        const title = disabled
            ? 'Only ' +
              parentOptions.size +
              ' ' +
              (parentOptions.size === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural) +
              ' available.'
            : undefined;

        return (
            <AddEntityButton
                containerClass="entity-insert--entity-add-button"
                key={'add-entity-' + queryName}
                entity={capitalizeFirstChar(entityDataType.nounAsParentSingular)}
                title={title}
                disabled={disabled}
                onClick={this.addParent.bind(this, queryName)}
            />
        );
    };

    renderParentTypesAndButtons = (): ReactNode => {
        const { insertModel } = this.state;
        const { parentDataTypes, combineParentTypes } = this.props;

        if (insertModel) {
            const { isInit, targetEntityType } = insertModel;

            if (isInit && targetEntityType && parentDataTypes) {
                return (
                    <>
                        {combineParentTypes
                            ? // Just grabbing first parent type for the name
                              this.renderParentTypes(parentDataTypes.get(0))
                            : parentDataTypes.map(this.renderParentTypes)}
                        <div className="entity-insert--header">
                            {combineParentTypes
                                ? // Just grabbing first parent type for the name
                                  this.renderAddEntityButton(parentDataTypes.get(0))
                                : parentDataTypes.map(this.renderAddEntityButton)}
                        </div>
                    </>
                );
            }
        }

        return null;
    };

    renderHeader = (isGrid: boolean): ReactNode => {
        const { insertModel } = this.state;

        if (!insertModel) return null;

        const id = generateId('targetEntityType-');
        const hasTargetEntityType = insertModel.hasTargetEntityType();

        return (
            <>
                {insertModel.isInit && (
                    <SelectInput
                        formsy={false}
                        inputClass="col-sm-5"
                        label={this.capTypeTextSingular}
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name={id}
                        id={id}
                        placeholder={'Select a ' + this.capTypeTextSingular + '...'}
                        onChange={this.changeTargetEntityType}
                        options={insertModel.entityTypeOptions.toArray()}
                        required
                        value={hasTargetEntityType ? insertModel.targetEntityType.label.toLowerCase() : undefined}
                    />
                )}
                {insertModel.isError && (
                    <Alert>
                        {insertModel.errors ??
                            'Something went wrong loading the data for this page.  Please try again.'}
                    </Alert>
                )}
                {!insertModel.isError && isGrid && hasTargetEntityType && this.renderParentTypesAndButtons()}
            </>
        );
    };

    onRowCountChange = (): void => {
        const { insertModel } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryModel.getId());
        if (editorModel) {
            this.setState(() => {
                return {
                    insertModel: insertModel.set('entityCount', editorModel.rowCount) as EntityIdCreationModel,
                };
            });
            this.props.onDataChange?.(editorModel.rowCount > 0, IMPORT_DATA_FORM_TYPES.GRID);
        }
    };

    onCancel = (): void => {
        // if cancelling, presumably they know that they want to discard changes.
        this.props.onDataChange?.(false);

        if (this.props.onCancel) {
            this.removeQueryGridModel();
            this.props.onCancel();
        } else {
            const { insertModel } = this.state;
            const updatedModel = insertModel.merge({
                isError: false,
                errors: undefined,
            }) as EntityIdCreationModel;
            this.setState({ insertModel: updatedModel });
            queryGridInvalidate(updatedModel.getSchemaQuery());
            this.gridInit(updatedModel);
        }
    };

    setSubmitting = (isSubmitting: boolean): void => {
        this.setState({ isSubmitting });
    };

    insertRowsFromGrid = async (): Promise<void> => {
        const { insertModel } = this.state;
        const { entityDataType } = this.props;
        const queryGridModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryGridModel.getId());
        const errors = editorModel.getValidationErrors(queryGridModel, entityDataType.uniqueFieldKey);
        if (errors.length > 0) {
            this.setSubmitting(false);
            gridShowError(
                queryGridModel,
                {
                    message: errors.join('  '),
                },
                this
            );
            return;
        }

        this.setSubmitting(true);

        try {
            const response = await insertModel.postEntityGrid(queryGridModel);

            this.setSubmitting(false);

            if (response?.rows) {
                this.props.onDataChange?.(false);
                this.props.afterEntityCreation?.(
                    insertModel.getTargetEntityTypeLabel(),
                    response.getFilter(),
                    response.rows.length,
                    'created',
                    response.transactionAuditId
                );
            } else {
                gridShowError(
                    queryGridModel,
                    {
                        message: 'Insert response has unexpected format. No "rows" available.',
                    },
                    this
                );
            }
        } catch (error) {
            this.setSubmitting(false);

            gridShowError(
                queryGridModel,
                {
                    message: resolveErrorMessage(error.error, this.props.nounPlural),
                },
                this
            );
        }
    };

    isNameRequired = (): boolean => {
        return !!this.getQueryGridModel()?.isRequiredColumn(this.props.entityDataType.uniqueFieldKey);
    };

    renderGridButtons = (): ReactNode => {
        const { insertModel, isSubmitting } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = queryModel ? getEditorModel(queryModel.getId()) : undefined;
        if (insertModel?.isInit) {
            const noun = insertModel.entityCount === 1 ? this.capNounSingular : this.capNounPlural;
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
        const { insertModel } = this.state;
        const queryGridModel = this.getQueryGridModel();

        if (!queryGridModel || !queryGridModel.queryInfo) return null;

        // format/process parent column and values, for now, only parents are populated
        const allRows = insertModel.getGridValues(queryGridModel.queryInfo, false);

        if (allRows.size > 0) {
            let valueMap = Map<string, any>();
            let values = '';
            let sep = '';
            const row = allRows.get(0); // for insert, use the first (and only) row data
            row.keySeq().forEach(col => {
                row.get(col).forEach(val => {
                    values = values + sep + val.value;
                    sep = ',';
                });
                // for some reason selectinput errors out if values are supplied as array
                valueMap = valueMap.set(col, values);
            });
            return valueMap.toObject();
        }

        return null;
    };

    onTabChange = (): void => {
        this.setState({ error: undefined });
    };

    getInsertColumns = (): List<QueryColumn> => {
        const model = this.getQueryGridModel();
        let columns : List<QueryColumn> = model
            .getInsertColumns()
            .filter(col => col.derivationDataScope !== DERIVATION_DATA_SCOPE_CHILD_ONLY)
            .toList();
        // we add the UniqueId columns, which will be displayed as read-only fields
        columns = columns.concat(model.queryInfo.getUniqueIdColumns()).toList();
        return columns;
    };

    columnFilter = (col: QueryColumn): boolean => {
        return (
            insertColumnFilter(col) &&
            col.fieldKey !== this.props.entityDataType.uniqueFieldKey &&
            col.derivationDataScope !== DERIVATION_DATA_SCOPE_CHILD_ONLY
        );
    };

    getGeneratedIdColumnMetadata() : Map<string, EditableColumnMetadata> {
        const { entityDataType, nounSingular, nounPlural } = this.props;
        let columnMetadata = getUniqueIdColumnMetadata(this.getGridQueryInfo());
        if (!this.isNameRequired()) {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                readOnly: false,
                placeholder: '[generated id]',
                toolTip: `A generated ${nounSingular} ID will be provided for ${nounPlural} that don't have a user-provided ID in the grid.`,
            });
        } else {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                toolTip: `A ${nounSingular} ID is required for each ${nounSingular} since this ${this.typeTextSingular} has no naming pattern. You can provide a naming pattern by editing the ${this.typeTextSingular} design.`,
            });
        }
        return columnMetadata;
    }

    renderCreateFromGrid = (): ReactNode => {
        const { insertModel } = this.state;
        const { creationTypeOptions, entityDataType, nounPlural, nounSingular, onBulkAdd } = this.props;

        let columnMetadata = this.getGeneratedIdColumnMetadata();

        const queryGridModel = this.getQueryGridModel();
        const isLoaded = !!queryGridModel?.isLoaded;

        return (
            <>
                {this.renderHeader(true)}
                <hr className="bottom-spacing" />
                <div className="top-spacing">
                    {!isLoaded && !insertModel.isError && !!insertModel.targetEntityType?.value && (
                        <LoadingSpinner wrapperClassName="loading-data-message" />
                    )}
                    {isLoaded && (
                        <EditableGridPanel
                            addControlProps={{
                                nounSingular: this.capNounSingular,
                                nounPlural: this.capNounPlural,
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
                                title: `Bulk Creation of ${this.capNounPlural}`,
                                header: `Add a batch of ${nounPlural} that will share the properties set below.`,
                                columnFilter: this.columnFilter,
                                fieldValues: this.getBulkAddFormValues(),
                                creationTypeOptions,
                                countText: `New ${nounPlural}`,
                            }}
                            onBulkAdd={onBulkAdd}
                            bulkUpdateProps={{ columnFilter: this.columnFilter }}
                            bulkRemoveText={'Remove ' + this.capNounPlural}
                            columnMetadata={columnMetadata}
                            onRowCountChange={this.onRowCountChange}
                            model={queryGridModel}
                            initialEmptyRowCount={0}
                            emptyGridMsg={`Start by adding the quantity of ${nounPlural} you want to create.`}
                            maxTotalRows={this.props.maxEntities}
                            getInsertColumns={this.getInsertColumns}
                        />
                    )}
                </div>
            </>
        );
    };

    toggleInsertOptionChange = (): void => {
        this.setState(state => ({ isMerge: !state.isMerge }));
    };

    handleFileChange = (files: Map<string, File>): void => {
        const { asyncSize } = this.props;

        this.props.onDataChange?.(files.size > 0, IMPORT_DATA_FORM_TYPES.FILE);

        const fileSize = files.valueSeq().first().size;
        this.setState({
            error: undefined,
            file: files.first(),
            useAsync: asyncSize && fileSize > asyncSize,
            fieldsWarningMsg: undefined,
        });
    };

    handleFileRemoval = (): void => {
        this.props.onDataChange?.(false, IMPORT_DATA_FORM_TYPES.FILE);

        this.setState({
            error: undefined,
            file: undefined,
            useAsync: false,
            fieldsWarningMsg: undefined,
        });
    };

    submitFileHandler = async (): Promise<void> => {
        const {
            fileImportParameters,
            nounPlural,
            entityDataType,
            onDataChange,
            onBackgroundJobStart,
            afterEntityCreation,
        } = this.props;
        const { insertModel, file, isMerge, originalQueryInfo, useAsync } = this.state;

        if (!fileImportParameters) return;

        this.setSubmitting(true);
        try {
            const response = await handleEntityFileImport(
                entityDataType.importFileAction,
                fileImportParameters,
                originalQueryInfo,
                file,
                isMerge,
                useAsync
            );

            this.setSubmitting(false);
            onDataChange?.(false);
            if (useAsync) {
                onBackgroundJobStart?.(insertModel.getTargetEntityTypeLabel(), file.name, response.jobId);
            } else {
                afterEntityCreation?.(
                    insertModel.getTargetEntityTypeLabel(),
                    null,
                    response.rowCount,
                    'imported',
                    response.transactionAuditId
                );
            }
        } catch (error) {
            this.setState({
                error: resolveErrorMessage(error, nounPlural, nounPlural, 'importing'),
                isSubmitting: false,
            });
        }
    };

    getTemplateUrl = (): any => {
        const { getFileTemplateUrl } = this.props;
        const { originalQueryInfo } = this.state;
        if (getFileTemplateUrl && originalQueryInfo) return getFileTemplateUrl(originalQueryInfo);

        return originalQueryInfo &&
            Utils.isArray(originalQueryInfo.importTemplates) &&
            originalQueryInfo.importTemplates[0]
            ? originalQueryInfo.importTemplates[0].url
            : undefined;
    };

    isGridStep = (): boolean => {
        return this.props.currentStep === EntityInsertPanelTabs.First && !this.props.importOnly;
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

    static getWarningFieldList(names: string[]) : ReactNode {
        const oxfordComma = names.length > 2 ? ',' : '';
        return names.map((name, index) => (
            <span key={name}>
                <b>{name}</b>{index === names.length-2 ? oxfordComma + ' and ' : index < names.length-2 ? ', ': ''}
            </span>
        ))
    }

    static getInferredFieldWarnings(inferred: InferDomainResponse, domainDetails: DomainDetails, columns: OrderedMap<string, QueryColumn>, otherAllowedFields?: string[]): Array<React.ReactNode> {
        let uniqueIdFields = [];
        let unknownFields = [];
        const { domainDesign } = domainDetails;
        let allowedFields = Object.keys(domainDetails.options.get('importAliases')).map((key => key.toLowerCase()));
        if (otherAllowedFields) {
            allowedFields = allowedFields.concat(otherAllowedFields.map(field => field.toLowerCase()));
        }

        inferred.fields.forEach(field => {

            const lcName = field.name.toLowerCase();

            if (!field.isExpInput() && allowedFields.indexOf(lcName) < 0) {
                const aliasField = domainDesign.fields.find(domainField => domainField.importAliases?.toLowerCase().indexOf(lcName) >= 0);
                const columnName = aliasField ? aliasField.name : field.name;
                const column = columns.find(column => (column.isImportColumn(columnName)));

                if (!column) {
                    if (unknownFields.indexOf(field.name) < 0) {
                        unknownFields.push(field.name);
                    }
                } else if (column.isUniqueIdColumn) {
                    if (uniqueIdFields.indexOf(field.name) < 0) { // duplicate fields are handled as errors during import; we do not issue warnings about that here.
                        uniqueIdFields.push(field.name);
                    }
                }
            }
        });

        let msg = [];
        if (unknownFields.length > 0) {
            msg.push(
                <p key='unknownFields'>
                    {EntityInsertPanelImpl.getWarningFieldList(unknownFields)}
                    {((unknownFields.length === 1) ? " is an unknown field" : " are unknown fields") + " and will be ignored."}
                </p>
            );
        }
        if (uniqueIdFields.length > 0) {
            msg.push(
                <p key='uniqueIdFields'>
                    {EntityInsertPanelImpl.getWarningFieldList(uniqueIdFields)}
                    {((uniqueIdFields.length === 1) ? " is a unique ID field. It" : " are unique ID fields. They")  + " will not be imported and will be managed by " + getCurrentProductName() + "."}
                </p>
            );
        }
        return msg;
    }

    onPreviewLoad = (inferred: InferDomainResponse): any => {
        const { allowedNonDomainFields } = this.props;
        const { insertModel, originalQueryInfo } = this.state;
        fetchDomainDetails(undefined, insertModel.getSchemaQuery().schemaName, insertModel.getSchemaQuery().queryName).
            then(domainDetails => {
                const msg = EntityInsertPanelImpl.getInferredFieldWarnings(inferred, domainDetails, originalQueryInfo.columns, allowedNonDomainFields);

                if (msg.length > 0) {
                    this.setState({fieldsWarningMsg: <>{msg}</>});
                }
            })
            .catch(reason => {
                console.error("Unable to retrieve domain ", reason);
            });
    }

    render() {
        const {
            canEditEntityTypeDetails,
            disableMerge,
            fileSizeLimits,
            importOnly,
            nounPlural,
            entityDataType,
        } = this.props;
        const { error, file, insertModel, isMerge, isSubmitting, originalQueryInfo } = this.state;

        if (!insertModel) {
            if (error) {
                return <Alert>{error}</Alert>;
            } else {
                return <LoadingSpinner wrapperClassName="loading-data-message" />;
            }
        }

        const isGridStep = this.isGridStep();
        const entityTypeName = insertModel.getTargetEntityTypeLabel();
        const editEntityTypeDetailsLink =
            entityTypeName && entityDataType?.editTypeAppUrlPrefix
                ? AppURL.create(entityDataType.editTypeAppUrlPrefix, entityTypeName)
                : undefined;

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
                                {!importOnly && (
                                    <FormStep stepIndex={EntityInsertPanelTabs.First}>
                                        {this.renderCreateFromGrid()}
                                    </FormStep>
                                )}
                                <FormStep
                                    stepIndex={importOnly ? EntityInsertPanelTabs.First : EntityInsertPanelTabs.Second}
                                >
                                    {this.renderHeader(false)}
                                    {!disableMerge && (
                                        <div className="margin-bottom">
                                            <input
                                                type="checkbox"
                                                checked={isMerge}
                                                onChange={this.toggleInsertOptionChange}
                                            />
                                            <span
                                                className="entity-mergeoption-checkbox"
                                                onClick={this.toggleInsertOptionChange}
                                            >
                                                Update data for existing {nounPlural} during this file import
                                            </span>
                                            &nbsp;
                                            <LabelHelpTip title="Import Options">
                                                <p>
                                                    By default, import will insert new {nounPlural} based on the file
                                                    provided. The operation will fail if there are existing{' '}
                                                    {this.capIdsText} that match those being imported.
                                                </p>
                                                <p>
                                                    When update is selected, data will be updated for matching{' '}
                                                    {this.capIdsText}, and new {nounPlural} will be created for any new{' '}
                                                    {this.capIdsText} provided. Data will not be changed for any columns
                                                    not in the imported file.
                                                </p>
                                                <p>
                                                    For more information on import options for {nounPlural}, see the{' '}
                                                    {this.props.importHelpLinkNode} documentation page.
                                                </p>
                                            </LabelHelpTip>
                                        </div>
                                    )}
                                    <FileAttachmentForm
                                        showLabel={false}
                                        acceptedFormats=".csv, .tsv, .txt, .xls, .xlsx"
                                        allowMultiple={false}
                                        allowDirectories={false}
                                        previewGridProps={{ previewCount: 3, onPreviewLoad: this.onPreviewLoad, warningMsg: this.state.fieldsWarningMsg }}
                                        onFileChange={this.handleFileChange}
                                        onFileRemoval={this.handleFileRemoval}
                                        templateUrl={this.getTemplateUrl()}
                                        sizeLimits={fileSizeLimits}
                                        sizeLimitsHelpText={
                                            <>
                                                We recommend dividing your data into smaller files that meet this limit.
                                                See our {helpLinkNode(DATA_IMPORT_TOPIC, 'help article')} for best
                                                practices on data import.
                                            </>
                                        }
                                    />
                                </FormStep>
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

export const EntityInsertPanelFormSteps = withFormSteps(EntityInsertPanelImpl, {
    currentStep: EntityInsertPanelTabs.First,
    furthestStep: EntityInsertPanelTabs.Second,
    hasDependentSteps: false,
});

export const EntityInsertPanel: FC<{ location?: Location } & OwnProps> = memo(props => {
    const { location, ...entityInsertPanelProps } = props;

    const fromLocationProps = useMemo<FromLocationProps>(() => {
        if (!location) {
            return {};
        }

        const { creationType, numPerParent, parent, selectionKey, tab, target } = location.query;

        return {
            creationType,
            numPerParent,
            parents: parent?.split(';'),
            selectionKey,
            tab: parseInt(tab, 10),
            target,
        };
    }, [location]);

    return <EntityInsertPanelFormSteps {...entityInsertPanelProps} {...fromLocationProps} />;
});

EntityInsertPanel.displayName = 'EntityInsertPanel';
