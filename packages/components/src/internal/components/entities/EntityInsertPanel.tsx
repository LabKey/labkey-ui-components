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
import React, { ReactNode } from 'react';
import ReactN from 'reactn';
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
    insertColumnFilter,
    InsertRowsResponse,
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
    SampleCreationTypeModel,
    SchemaQuery,
    SelectInput,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons,
} from '../../..';

import { PlacementType } from '../editable/Controls';

import { DATA_IMPORT_TOPIC } from '../../util/helpLinks';

import {
    EntityDataType,
    EntityIdCreationModel,
    EntityInsertPanelTabs,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
} from './models';

import { getEntityTypeData } from './actions';
import { BulkAddData } from "../editable/EditableGrid";

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
    disableMerge?: boolean;
    afterEntityCreation?: (entityTypeName, filter, entityCount, actionStr, transactionAuditId?) => void;
    onBackgroundJobStart?: (entityTypeName, filename, jobId) => void;
    getFileTemplateUrl?: (queryInfo: QueryInfo) => string;
    location?: Location;
    onCancel?: () => void;
    maxEntities?: number;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    handleFileImport?: (queryInfo: QueryInfo, file: File, isMerge: boolean, isAsync?: boolean) => Promise<any>;
    canEditEntityTypeDetails?: boolean;
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => void;
    nounSingular: string;
    nounPlural: string;
    entityDataType: EntityDataType;
    parentDataTypes?: List<EntityDataType>;
    onParentChange?: (parentTypes: Map<string, List<EntityParentType>>) => void;
    onBulkAdd?: (data: OrderedMap<string, any>) => BulkAddData
    creationTypeOptions?: Array<SampleCreationTypeModel>;
    importHelpLinkNode: ReactNode;
    auditBehavior?: AuditBehaviorTypes;
    importOnly?: boolean;
    combineParentTypes?: boolean; // Puts all parent types in one parent button. Name on the button will be the first parent type listed
    asyncSize?: number; // the file size cutoff to enable async import. If undefined, async is not supported
}

type Props = OwnProps & WithFormStepsProps;

interface StateProps {
    insertModel: EntityIdCreationModel;
    originalQueryInfo: QueryInfo;
    isSubmitting: boolean;
    error: ReactNode;
    isMerge: boolean;
    file: File;
    useAsync: boolean;
}

export class EntityInsertPanelImpl extends ReactN.Component<Props, StateProps> {
    private readonly capNounSingular;
    private readonly capNounPlural;
    private readonly capIdsText;
    private readonly capTypeTextSingular;
    private readonly typeTextSingular;
    private readonly typeTextPlural;

    constructor(props: any) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
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
        };
    }

    UNSAFE_componentWillMount(): void {
        this.init(this.props, true);
    }

    UNSAFE_componentWillReceiveProps(nextProps: OwnProps): void {
        if (this.props.location != nextProps.location || this.props.entityDataType !== nextProps.entityDataType)
            this.init(nextProps);
    }

    componentWillUnmount() {
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

    static getQueryParameters(query: any) {
        const { parent, selectionKey, target, creationType, numPerParent } = query;
        let parents;
        if (parent) {
            parents = parent.split(';');
        }

        return {
            parents,
            selectionKey,
            target,
            creationType,
            numPerParent
        };
    }

    init = (props: OwnProps, selectTab = false) => {
        const queryParams = props.location
            ? EntityInsertPanelImpl.getQueryParameters(props.location.query)
            : {
                  parents: undefined,
                  selectionKey: undefined,
                  target: undefined,
                  creationType: undefined,
                  numPerParent: undefined
              };
        const allowParents = this.allowParents();

        const tab =
            props.location && props.location.query && props.location.query.tab
                ? props.location.query.tab
                : EntityInsertPanelTabs.First;
        if (selectTab && tab != EntityInsertPanelTabs.First) this.props.selectStep(parseInt(tab));

        let { insertModel } = this.state;

        if (
            insertModel &&
            insertModel.getTargetEntityTypeName() === queryParams.target &&
            insertModel.selectionKey === queryParams.selectionKey &&
            (insertModel.originalParents === queryParams.parents || !allowParents)
        )
            return;

        const { entityDataType, auditBehavior } = props;
        insertModel = new EntityIdCreationModel({
            originalParents: allowParents ? queryParams.parents : undefined,
            initialEntityType: queryParams.target,
            selectionKey: queryParams.selectionKey,
            entityCount: 0,
            entityDataType,
            auditBehavior,
            creationType: queryParams.creationType,
            numPerParent: queryParams.numPerParent || 1
        });

        let parentSchemaQueries = Map<string, EntityDataType>();
        if (this.props.parentDataTypes) {
            this.props.parentDataTypes.forEach(dataType => {
                parentSchemaQueries = parentSchemaQueries.set(dataType.instanceSchemaName, dataType);
            });
        }
        getEntityTypeData(
            insertModel,
            entityDataType,
            parentSchemaQueries,
            entityDataType.typeListingSchemaQuery.queryName,
            allowParents
        )
            .then(partialModel => {
                const updatedModel = insertModel.merge(partialModel) as EntityIdCreationModel;
                this.gridInit(updatedModel);
            })
            .catch(() => {
                this.setState(() => ({
                    error: getActionErrorMessage(
                        'There was a problem initializing the data for import.',
                        this.typeTextPlural
                    ),
                }));
            });
    };

    gridInit = (insertModel: EntityIdCreationModel): void => {
        const schemaQuery = insertModel.getSchemaQuery();
        if (schemaQuery) {
            getQueryDetails(schemaQuery.toJS())
                .then(originalQueryInfo => {
                    this.setState(
                        () => {
                            return {
                                insertModel,
                                originalQueryInfo,
                            };
                        },
                        () => {
                            gridInit(this.getQueryGridModel(), true, this);
                        }
                    );
                })
                .catch(() => {
                    this.setState(() => {
                        return {
                            insertModel: insertModel.merge({
                                isError: true,
                                errors:
                                    'Problem retrieving data for ' +
                                    this.typeTextSingular +
                                    " '" +
                                    insertModel.getTargetEntityTypeName() +
                                    "'.",
                            }) as EntityIdCreationModel,
                        };
                    });
                });
        } else {
            this.setState(
                () => {
                    return {
                        insertModel,
                    };
                },
                () => {
                    gridInit(this.getQueryGridModel(), true, this);
                }
            );
        }
    };

    getQueryGridModel = (): QueryGridModel => {
        const { insertModel } = this.state;

        if (insertModel) {
            const entityTypeName = insertModel ? insertModel.getTargetEntityTypeName() : undefined;
            if (entityTypeName) {
                const queryInfoWithParents = this.getGridQueryInfo();
                const model = getStateQueryGridModel(
                    'insert-entities',
                    SchemaQuery.create(this.props.entityDataType.instanceSchemaName, entityTypeName),
                    {
                        editable: true,
                        loader: new EntityGridLoader(insertModel),
                        queryInfo: queryInfoWithParents,
                    }
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
            () => {
                return {
                    originalQueryInfo: undefined,
                    insertModel: updatedModel,
                };
            },
            () => {
                if (!selectedOption) {
                    queryGridInvalidate(insertModel.getSchemaQuery(), true);
                }
                this.gridInit(updatedModel);
            }
        );
    };

    addParent = (queryName: string): void => {
        this.setState(state => {
            return {
                insertModel: state.insertModel.addParent(queryName),
            };
        });
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
                            if (existingParent.index === 1)  {
                                fieldKey = entityDataType.uniqueFieldKey;
                            }
                            else {
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
            () => {
                return {
                    insertModel: updatedModel,
                };
            },
            () => {
                this.props.onParentChange?.(updatedModel.entityParents);
                removeColumn(this.getQueryGridModel(), parentColumnName);
            }
        );
    };

    renderParentTypes = (entityDataType: EntityDataType): ReactNode => {
        const { insertModel } = this.state;
        const { combineParentTypes } = this.props;
        const queryName = entityDataType.typeListingSchemaQuery.queryName;
        const entityParents = insertModel.getParentEntities(combineParentTypes, queryName);

        return entityParents
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
        const queryName = entityDataType.typeListingSchemaQuery.queryName;
        const parentOptions = insertModel.parentOptions.get(queryName);
        const entityParents = insertModel.getParentEntities(combineParentTypes, queryName);
        if (parentOptions.size === 0) return null;
        else {
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
        }
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
                            : parentDataTypes.map(dataType => {
                                  return this.renderParentTypes(dataType);
                              })}
                        <div className="entity-insert--header">
                            {combineParentTypes
                                ? // Just grabbing first parent type for the name
                                  this.renderAddEntityButton(parentDataTypes.get(0))
                                : parentDataTypes.map(dataType => {
                                      return this.renderAddEntityButton(dataType);
                                  })}
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
                        value={
                            insertModel && insertModel.hasTargetEntityType()
                                ? insertModel.targetEntityType.label.toLowerCase()
                                : undefined
                        }
                    />
                )}
                {insertModel.isError
                    ? this.renderError()
                    : isGrid && insertModel.hasTargetEntityType()
                    ? this.renderParentTypesAndButtons()
                    : ''}
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
            if (this.props.onDataChange) {
                this.props.onDataChange(editorModel.rowCount > 0, IMPORT_DATA_FORM_TYPES.GRID);
            }
        }
    };

    onCancel = (): void => {
        if (this.props.onDataChange) {
            this.props.onDataChange(false); // if cancelling, presumably they know that they want to discard changes.
        }
        if (this.props.onCancel) {
            this.removeQueryGridModel();
            this.props.onCancel();
        } else {
            const { insertModel } = this.state;
            const updatedModel = insertModel.merge({
                isError: false,
                errors: undefined,
            }) as EntityIdCreationModel;
            this.setState(() => {
                return {
                    insertModel: updatedModel,
                };
            });
            queryGridInvalidate(updatedModel.getSchemaQuery());
            this.gridInit(updatedModel);
        }
    };

    setSubmitting = (isSubmitting: boolean): void => {
        this.setState(() => ({ isSubmitting }));
    };

    insertRowsFromGrid = (): void => {
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
        insertModel
            .postEntityGrid(this.getQueryGridModel())
            .then((response: InsertRowsResponse) => {
                if (response && response.rows) {
                    this.setSubmitting(false);
                    if (this.props.onDataChange) {
                        this.props.onDataChange(false);
                    }
                    if (this.props.afterEntityCreation) {
                        this.props.afterEntityCreation(
                            insertModel.getTargetEntityTypeName(),
                            response.getFilter(),
                            response.rows.length,
                            'created',
                            response.transactionAuditId
                        );
                    }
                } else {
                    this.setSubmitting(false);
                    gridShowError(
                        queryGridModel,
                        {
                            message: 'Insert response has unexpected format. No "rows" available.',
                        },
                        this
                    );
                }
            })
            .catch((response: InsertRowsResponse) => {
                this.setSubmitting(false);
                const message = resolveErrorMessage(response.error, this.props.nounPlural);
                gridShowError(
                    queryGridModel,
                    {
                        message,
                    },
                    this
                );
            });
    };

    isNameRequired = (): boolean => {
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {
            return queryGridModel.isRequiredColumn(this.props.entityDataType.uniqueFieldKey);
        }
        return false;
    };

    renderGridButtons = (): ReactNode => {
        const { insertModel, isSubmitting } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = queryModel ? getEditorModel(queryModel.getId()) : undefined;
        if (insertModel && insertModel.isInit) {
            const noun = insertModel.entityCount == 1 ? this.capNounSingular : this.capNounPlural;
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

    renderError = (): ReactNode => {
        const { insertModel } = this.state;
        if (insertModel.isError) {
            return (
                <Alert>
                    {insertModel.errors
                        ? insertModel.errors
                        : 'Something went wrong loading the data for this page.  Please try again.'}
                </Alert>
            );
        }
    };

    getBulkAddFormValues = (): any => {
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
        this.setState(() => ({ error: undefined }));
    };

    renderCreateFromGrid = (): ReactNode => {
        const { insertModel } = this.state;
        const { entityDataType, creationTypeOptions, onBulkAdd } = this.props;

        const columnFilter = colInfo => {
            return insertColumnFilter(colInfo) && colInfo['fieldKey'] !== entityDataType.uniqueFieldKey;
        };

        const bulkAddProps = {
            title: 'Bulk Creation of ' + this.capNounPlural,
            header: 'Add a batch of ' + this.props.nounPlural + ' that will share the properties set below.',
            columnFilter,
            fieldValues: this.getBulkAddFormValues(),
            creationTypeOptions,
            countText: "New " + this.props.nounPlural,
        };
        const bulkUpdateProps = {
            columnFilter,
        };
        const addControlProps = {
            nounSingular: this.capNounSingular,
            nounPlural: this.capNounPlural,
            placement: 'top' as PlacementType,
            wrapperClass: 'pull-left',
            maxCount: MAX_EDITABLE_GRID_ROWS,
        };
        let columnMetadata = Map<string, EditableColumnMetadata>();
        if (!this.isNameRequired()) {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                readOnly: false,
                placeholder: '[generated id]',
                toolTip:
                    'A generated ' +
                    this.props.nounSingular +
                    ' ID will be provided for ' +
                    this.props.nounPlural +
                    " that don't have a user-provided ID in the grid.",
            });
        } else {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                toolTip:
                    'A ' +
                    this.props.nounSingular +
                    ' ID is required for each ' +
                    this.props.nounSingular +
                    ' since this ' +
                    this.typeTextSingular +
                    ' has no naming pattern. You can provide a naming pattern by editing the ' +
                    this.typeTextSingular +
                    ' design.',
            });
        }

        const queryGridModel = this.getQueryGridModel();

        return (
            <>
                {this.renderHeader(true)}
                <hr className="bottom-spacing" />
                <div className="top-spacing">
                    {queryGridModel && queryGridModel.isLoaded ? (
                        <EditableGridPanel
                            addControlProps={addControlProps}
                            allowBulkRemove={true}
                            allowBulkAdd={true}
                            allowBulkUpdate={true}
                            bordered={true}
                            condensed={false}
                            striped={true}
                            bulkAddText="Bulk Insert"
                            bulkAddProps={bulkAddProps}
                            onBulkAdd={onBulkAdd}
                            bulkUpdateProps={bulkUpdateProps}
                            bulkRemoveText={'Remove ' + this.capNounPlural}
                            columnMetadata={columnMetadata}
                            onRowCountChange={this.onRowCountChange}
                            model={queryGridModel}
                            initialEmptyRowCount={0}
                            emptyGridMsg={
                                'Start by adding the quantity of ' + this.props.nounPlural + ' you want to create.'
                            }
                            maxTotalRows={this.props.maxEntities}
                        />
                    ) : !insertModel.isError && insertModel.targetEntityType && insertModel.targetEntityType.value ? (
                        <LoadingSpinner wrapperClassName="loading-data-message" />
                    ) : null}
                </div>
            </>
        );
    };

    toggleInsertOptionChange = (): void => {
        this.setState(state => ({ isMerge: !state.isMerge }));
    };

    renderImportOptions = (): ReactNode => {
        return (
            <div className="margin-bottom">
                <input type="checkbox" checked={this.state.isMerge} onChange={this.toggleInsertOptionChange} />
                <span className="entity-mergeoption-checkbox" onClick={this.toggleInsertOptionChange}>
                    Update data for existing {this.props.nounPlural} during this file import
                </span>
                &nbsp;
                <LabelHelpTip title="Import Options">
                    <p>
                        By default, import will insert new {this.props.nounPlural} based on the file provided. The
                        operation will fail if there are existing {this.capIdsText} that match those being imported.
                    </p>
                    <p>
                        When update is selected, data will be updated for matching {this.capIdsText}, and new{' '}
                        {this.props.nounPlural} will be created for any new {this.capIdsText} provided. Data will not be
                        changed for any columns not in the imported file.
                    </p>
                    <p>
                        For more information on import options for {this.props.nounPlural}, see the{' '}
                        {this.props.importHelpLinkNode} documentation page.
                    </p>
                </LabelHelpTip>
            </div>
        );
    };

    handleFileChange = (files: Map<string, File>): void => {
        const { asyncSize } = this.props;

        if (this.props.onDataChange) {
            this.props.onDataChange(files.size > 0, IMPORT_DATA_FORM_TYPES.FILE);
        }

        const fileSize = files.valueSeq().first().size;
        this.setState(() => ({
            error: undefined,
            file: files.first(),
            useAsync: asyncSize && fileSize > asyncSize,
        }));
    };

    handleFileRemoval = (): void => {
        if (this.props.onDataChange) {
            this.props.onDataChange(false, IMPORT_DATA_FORM_TYPES.FILE);
        }
        this.setState(() => ({
            error: undefined,
            file: undefined,
            useAsync: false,
        }));
    };

    submitFileHandler = (): void => {
        const { handleFileImport } = this.props;
        const { insertModel, file, isMerge, originalQueryInfo, useAsync } = this.state;

        if (!handleFileImport) return;

        this.setSubmitting(true);

        handleFileImport(originalQueryInfo, file, isMerge, useAsync)
            .then(response => {
                this.setSubmitting(false);
                if (this.props.onDataChange) {
                    this.props.onDataChange(false);
                }
                if (!useAsync && this.props.afterEntityCreation) {
                    this.props.afterEntityCreation(
                        insertModel.getTargetEntityTypeName(),
                        null,
                        response.rowCount,
                        'imported',
                        response.transactionAuditId
                    );
                }
                if (useAsync && this.props.onBackgroundJobStart) {
                    this.props.onBackgroundJobStart(insertModel.getTargetEntityTypeName(), file.name, response.jobId);
                }
            })
            .catch(error => {
                this.setState(() => ({
                    error: resolveErrorMessage(error, this.props.nounPlural, this.props.nounPlural, 'importing'),
                    isSubmitting: false,
                }));
            });
    };

    renderFileButtons = (): ReactNode => {
        const { isSubmitting, file, originalQueryInfo } = this.state;

        return (
            <WizardNavButtons
                cancel={this.onCancel}
                containerClassName=""
                canFinish={file !== undefined && originalQueryInfo !== undefined}
                finish={true}
                nextStep={this.submitFileHandler} // nextStep is the function that will get called when finish button clicked
                isFinishing={isSubmitting}
                finishText="Import"
                isFinishingText="Importing..."
            />
        );
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

    renderImportEntitiesFromFile = (): ReactNode => {
        const { fileSizeLimits, disableMerge } = this.props;

        return (
            <>
                {this.renderHeader(false)}
                {!disableMerge && this.renderImportOptions()}
                <FileAttachmentForm
                    showLabel={false}
                    acceptedFormats=".csv, .tsv, .txt, .xls, .xlsx"
                    allowMultiple={false}
                    allowDirectories={false}
                    previewGridProps={{ previewCount: 3 }}
                    onFileChange={this.handleFileChange}
                    onFileRemoval={this.handleFileRemoval}
                    templateUrl={this.getTemplateUrl()}
                    sizeLimits={fileSizeLimits}
                    sizeLimitsHelpText={
                        <>
                            We recommend dividing your data into smaller files that meet this limit. See our{' '}
                            {helpLinkNode(DATA_IMPORT_TOPIC, 'help article')} for best practices on data import.
                        </>
                    }
                />
            </>
        );
    };

    isGridStep = (): boolean => {
        return this.props.currentStep === EntityInsertPanelTabs.First && !this.props.importOnly;
    };

    renderButtons = (): ReactNode => {
        return this.isGridStep() ? this.renderGridButtons() : this.renderFileButtons();
    };

    renderProgress = (): ReactNode => {
        const { insertModel, isSubmitting, file } = this.state;

        return this.isGridStep() ? (
            <Progress
                estimate={insertModel.entityCount * 20}
                modal={true}
                title={'Generating ' + this.props.nounPlural}
                toggle={isSubmitting}
            />
        ) : (
            <Progress
                estimate={file ? file.size * 0.1 : undefined}
                modal={true}
                title={'Importing ' + this.props.nounPlural + ' from file'}
                toggle={isSubmitting}
            />
        );
    };

    render() {
        const { canEditEntityTypeDetails, importOnly } = this.props;
        const { insertModel, error } = this.state;

        if (!insertModel) {
            if (!error) return <LoadingSpinner wrapperClassName="loading-data-message" />;
            else return <Alert>{error}</Alert>;
        }

        const entityTypeName = insertModel.getTargetEntityTypeName();
        const editEntityTypeDetailsLink = entityTypeName
            ? AppURL.create(this.props.nounPlural, entityTypeName, 'update')
            : undefined;

        return (
            <>
                <div className="panel panel-default">
                    <div className="panel-body">
                        <div className="row">
                            <div className="import-panel col-sm-7">
                                <FormTabs tabs={this.getTabs()} onTabChange={this.onTabChange} />
                            </div>
                            {editEntityTypeDetailsLink && canEditEntityTypeDetails ? (
                                <div className="col-sm-5">
                                    <Link
                                        className="pull-right entity-insert--link"
                                        to={editEntityTypeDetailsLink.toString()}
                                    >
                                        Edit {this.capTypeTextSingular} Design
                                    </Link>
                                </div>
                            ) : undefined}
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
                                    {this.renderImportEntitiesFromFile()}
                                </FormStep>
                            </div>
                        </div>
                        {error != null && <Alert>{error}</Alert>}
                    </div>
                </div>
                {this.renderButtons()}
                {this.renderProgress()}
            </>
        );
    }
}

export const EntityInsertPanel = withFormSteps(EntityInsertPanelImpl, {
    currentStep: EntityInsertPanelTabs.First,
    furthestStep: EntityInsertPanelTabs.Second,
    hasDependentSteps: false,
});
