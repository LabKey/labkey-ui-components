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
import React from 'reactn';
import { Button } from 'react-bootstrap';
import { List, Map, OrderedMap } from 'immutable';
import { Utils } from '@labkey/api';

import {
    DATA_CLASS_UNIQUE_FIELD_KEY,
    IMPORT_DATA_FORM_TYPES,
    MAX_EDITABLE_GRID_ROWS,
    SAMPLE_UNIQUE_FIELD_KEY
} from '../../constants';

import { addColumns, changeColumn, gridInit, gridShowError, queryGridInvalidate, removeColumn } from '../../actions';
import { getEditorModel, getQueryGridModel, removeQueryGridModel } from '../../global';

import { getStateQueryGridModel } from '../../models';

import { EditableColumnMetadata } from '../editable/EditableGrid';
import { EditableGridPanel } from '../editable/EditableGridPanel';
import { getQueryDetails, InsertRowsResponse } from '../../query/api';
import { Location } from '../../util/URL';
import { SelectInput } from '../forms/input/SelectInput';

import {
    EntityIdCreationModel,
    EntityInsertPanelTabs,
    EntityParentType,
    EntityTypeOption,
    GenerateEntityResponse,
    IEntityTypeOption,
    IParentOption,
} from './models';
import { Progress } from '../base/Progress';
import { SCHEMAS } from '../base/models/schemas';
import { AppURL } from '../../url/AppURL';
import {
    IGridLoader,
    IGridResponse,
    insertColumnFilter,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    SchemaQuery,
} from '../base/models/model';
import { capitalizeFirstChar, } from '../../util/utils';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';
import { Alert } from '../base/Alert';
import { PlacementType } from "../editable/Controls";
import {
    DATA_IMPORT_TOPIC,
    EntityDataType,
    FileAttachmentForm, getActionErrorMessage,
    helpLinkNode,
    LabelHelpTip,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons
} from "../../index";
import { FormStep, FormTabs } from '../forms/FormStep';
import { FileSizeLimitProps } from "../files/models";
import { Link } from "react-router";
import { resolveErrorMessage } from '../../util/messaging';
import { initEntityTypeInsert } from './actions';

const IMPORT_SAMPLE_SETS_TOPIC = 'importSampleSets#more';

class EntityGridLoader implements IGridLoader {

    model: EntityIdCreationModel;

    constructor(model: EntityIdCreationModel) {
        this.model = model;
    }

    fetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        const data = this.model.getGridValues(gridModel.queryInfo);

        return Promise.resolve({
            data,
            dataIds: data.keySeq().toList()
        });
    }
}

interface OwnProps {
    afterEntityCreation?: (entityTypetName, filter, entityCount, actionStr) => void
    getFileTemplateUrl?: (queryInfo: QueryInfo) => string
    location?: Location
    onCancel?: () => void
    maxEntities?: number
    fileSizeLimits?: Map<string, FileSizeLimitProps>
    handleFileImport?: (queryInfo: QueryInfo, file: File, isMerge: boolean) => Promise<any>
    canEditEntityTypeDetails?: boolean
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => any
    nounSingular: string
    nounPlural: string
    entityDataType: EntityDataType
    importHelpLinkNode: React.ReactNode
}

type Props = OwnProps & WithFormStepsProps;

interface StateProps {
    insertModel: EntityIdCreationModel
    originalQueryInfo: QueryInfo
    isSubmitting: boolean
    error: React.ReactNode
    isMerge: boolean
    file: File
}

export class EntityInsertPanelImpl extends React.Component<Props, StateProps> {

    static defaultProps = {
        nounSingular: "sample",
        nounPlural: "samples",
        importHelpLinkNode: helpLinkNode(IMPORT_SAMPLE_SETS_TOPIC, "Import Sample Types")
    };

    private capNounSingular;
    private capNounPlural;
    private capIdsText;
    private capTypeTextSingular;
    private typeTextSingular;
    private typeTextPlural;

    constructor(props: any) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.capNounPlural = capitalizeFirstChar(props.nounPlural);
        this.capNounSingular = capitalizeFirstChar(props.nounSingular);
        this.capIdsText = this.capNounSingular + " IDs";
        this.capTypeTextSingular =  this.capNounSingular + " Type";
        this.typeTextSingular =  props.nounSingular + " type";
        this.typeTextPlural =  props.nounSingular + " types";

        this.state = {
            insertModel: undefined,
            originalQueryInfo: undefined,
            isSubmitting: false,
            error: undefined,
            isMerge: false,
            file: undefined,
        };
    }

    componentWillMount() {
        this.init(this.props, true)
    }

    componentWillReceiveProps(nextProps: OwnProps) {
        this.init(nextProps)
    }

    componentWillUnmount() {
        this.removeQueryGridModel();
    }

    removeQueryGridModel() {
        const gridModel = this.getQueryGridModel();

        if (gridModel) {
            removeQueryGridModel(gridModel);
        }
    }

    isSampleEntity() {
        return this.props.entityDataType === EntityDataType.Sample;
    }

    getTabs() : Array<string> {
        return ['Create ' + this.capNounPlural + ' from Grid', 'Import ' + this.capNounPlural + ' from File'];
    }

    static getQueryParameters(query: any) {
        const { parent, selectionKey, target } = query;
        let parents;
        if (parent) {
            parents = parent.split(';');
        }

        return {
            parents,
            selectionKey,
            target
        }
    }

    init(props: OwnProps, selectTab: boolean = false) {

        const queryParams = props.location ? EntityInsertPanelImpl.getQueryParameters(props.location.query) : {
            parents: undefined,
            selectionKey: undefined,
            target: undefined
        };

        const tab = props.location && props.location.query && props.location.query.tab ? props.location.query.tab : EntityInsertPanelTabs.Grid;
        if (selectTab && tab != EntityInsertPanelTabs.Grid)
            this.props.selectStep(parseInt(tab));

        let { insertModel } = this.state;

        if (insertModel
            && insertModel.getTargetEntityTypeName() === queryParams.target
            && insertModel.selectionKey === queryParams.selectionKey
            && insertModel.parents === queryParams.parents
        )
            return;

        insertModel = new EntityIdCreationModel({
            parents: queryParams.parents,
            initialEntityType: queryParams.target,
            selectionKey: queryParams.selectionKey,
            entityCount: 0,
            entityDataType: props.entityDataType,
        });

        const isSampleInsert = this.isSampleEntity();
        // TODO need a version of this for data classes, but also with the option for not requesting parent options
        initEntityTypeInsert(insertModel,
            isSampleInsert ? SCHEMAS.EXP_TABLES.SAMPLE_SETS : SCHEMAS.EXP_TABLES.DATA_CLASSES,
            isSampleInsert ? SCHEMAS.SAMPLE_SETS.SCHEMA : SCHEMAS.DATA_CLASSES.SCHEMA)
            .then((partialModel) => {
                const updatedModel = insertModel.merge(partialModel) as EntityIdCreationModel;
                this.gridInit(updatedModel);
            })
            .catch((reason) => {
                this.setState(() => ({error: getActionErrorMessage('There was a problem initializing the sample type create page.', 'sample types')}));
            });
    }

    gridInit(insertModel: EntityIdCreationModel) {
        const schemaQuery = insertModel.getSchemaQuery();
        if (schemaQuery) {
            getQueryDetails(schemaQuery.toJS()).then(originalQueryInfo => {
                this.setState(() => {
                    return {
                        insertModel: insertModel,
                        originalQueryInfo,
                    }
                }, () => {
                    gridInit(this.getQueryGridModel(), true, this);
                });

            }).catch((reason) => {
                this.setState(() => {
                    return {
                        insertModel: insertModel.merge({
                            isError: true,
                            errors: "Problem retrieving data for " + this.typeTextSingular + " '" + insertModel.getTargetEntityTypeName() + "'."
                        }) as EntityIdCreationModel
                    }
                })
            });
        }
        else {
            this.setState(() => {
                return {
                    insertModel
                }
            }, () => {
                gridInit(this.getQueryGridModel(), true, this);
            });

        }
    }

    getQueryGridModel(): QueryGridModel {
        const { insertModel } = this.state;

        if (insertModel) {
            const entityTypeName = insertModel ? insertModel.getTargetEntityTypeName() : undefined;
            if (entityTypeName) {
                const queryInfoWithParents = this.getGridQueryInfo();
                const model = getStateQueryGridModel('insert-entities', SchemaQuery.create(this.isSampleEntity() ? SCHEMAS.SAMPLE_SETS.SCHEMA : SCHEMAS.DATA_CLASSES.SCHEMA, entityTypeName),
                    {
                        editable: true,
                        loader: new EntityGridLoader(insertModel),
                        queryInfo: queryInfoWithParents
                    });

                return getQueryGridModel(model.getId()) || model;
            }

            return undefined;
        }
    }

    static convertParentInputSchema(parentSchema: string): string {
        return parentSchema === SCHEMAS.DATA_CLASSES.SCHEMA ? QueryColumn.DATA_INPUTS : QueryColumn.MATERIAL_INPUTS;
    }

    createParentColumnName(parent: EntityParentType) {
        const parentInputType = EntityInsertPanelImpl.convertParentInputSchema(parent.schema);
        const formattedQueryName = capitalizeFirstChar(parent.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        return [parentInputType, formattedQueryName].join('/');
    }

    getUniqueFieldKey() {
        return  this.isSampleEntity() ? SAMPLE_UNIQUE_FIELD_KEY : DATA_CLASS_UNIQUE_FIELD_KEY;
    }

    // TODO: We should stop generating this on the client and retrieve the actual ColumnInfo from the server
    generateParentColumn(parent: EntityParentType): QueryColumn {
        const parentInputType = EntityInsertPanelImpl.convertParentInputSchema(parent.schema);
        const formattedQueryName = capitalizeFirstChar(parent.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        const parentColName = [parentInputType, formattedQueryName].join('/');

        // 32671: Sample import and edit grid key ingredients on scientific name
        let displayColumn = this.getUniqueFieldKey();
        if (parent.schema && parent.query &&
            parent.schema.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName.toLowerCase() &&
            parent.query.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName.toLowerCase()) {
            displayColumn ='scientificName';
        }

        return QueryColumn.create({
            caption: formattedQueryName + ' Parents',
            description: 'Contains optional parent entity for this ' + formattedQueryName,
            fieldKeyArray: [parentColName],
            fieldKey: parentColName,
            lookup: {
                displayColumn,
                isPublic: true,
                keyColumn: 'RowId',
                multiValued: 'junction',
                queryName: parent.query,
                schemaName: parent.schema,
                table: parentInputType
            },
            name: parentColName,
            required: false,
            shownInInsertView: true,
            type: 'Text (String)',
            userEditable: true
        });
    }

    getParentColumns() : OrderedMap<string, QueryColumn> {

        const { insertModel } = this.state;
        let columns = OrderedMap<string, QueryColumn>();
        insertModel.entityParents.forEach((parent) => {
            if (parent.schema && parent.query) {
                const column = this.generateParentColumn(parent);
                // Issue 33653: query name is case-sensitive for some data inputs (parents)
                columns = columns.set(column.name.toLowerCase(), column);
            }
        });
        return columns;
    }

    getGridQueryInfo(): QueryInfo {
        const { insertModel, originalQueryInfo } = this.state;

        if (originalQueryInfo) {
            const uniqueFieldKey = this.getUniqueFieldKey();
            const nameIndex = Math.max(0, originalQueryInfo.columns.toList().findIndex((column) => (column.fieldKey === uniqueFieldKey)));
            const newColumnIndex = nameIndex + insertModel.entityParents.filter((parent) => parent.query !== undefined).count();
            const columns = originalQueryInfo.insertColumns(newColumnIndex, this.getParentColumns());
            return originalQueryInfo.merge({columns}) as QueryInfo;
        }
        return undefined;
    }

    changeTargetEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        const { insertModel } = this.state;

        let updatedModel = insertModel.merge({
            targetEntityType: new EntityTypeOption(selectedOption),
            isError: false,
            errors: undefined
        }) as EntityIdCreationModel;
        if (!selectedOption) {
            updatedModel = updatedModel.merge({
                entityParents: List<EntityParentType>()
            }) as EntityIdCreationModel;
        }

        this.setState(() => {
            return {
                originalQueryInfo: undefined,
                insertModel: updatedModel
            }
        }, () => {
            if (!selectedOption) {
                queryGridInvalidate(insertModel.getSchemaQuery(), true);
            }
            this.gridInit(updatedModel);
        });
    };

    addParent = () => {
        const { insertModel } = this.state;
        const nextIndex = insertModel.entityParents.size + 1;
        const updatedParents = insertModel.entityParents.push(EntityParentType.create({index: nextIndex}));

        this.setState(() => {
            return {
                insertModel: insertModel.set('entityParents', updatedParents) as EntityIdCreationModel
            }
        });
    };

    changeParent(index: number, fieldName: string, formValue: any, parent: IParentOption): void {
        const { insertModel } = this.state;
        let column;
        let parentColumnName;
        let existingParent;
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {

            let updatedModel = insertModel;
            if (parent) {
                const existingParentKey = insertModel.entityParents.findKey(parent => parent.get('index') === index);
                existingParent = insertModel.entityParents.get(existingParentKey);

                // bail out if the selected parent is the same as the existingParent for this index, i.e. nothing changed
                const schemaMatch = parent && existingParent && Utils.caseInsensitiveEquals(parent.schema, existingParent.schema);
                const queryMatch = parent && existingParent && Utils.caseInsensitiveEquals(parent.query, existingParent.query);
                if (schemaMatch && queryMatch) {
                    return;
                }

                const parentType = EntityParentType.create({
                    index,
                    key: existingParent.key,
                    query: parent.query,
                    schema: parent.schema
                });
                updatedModel = insertModel.mergeIn([
                    'entityParents',
                    existingParentKey
                ], parentType) as EntityIdCreationModel;
                column = this.generateParentColumn(parentType);
            }
            else {
                let parentToResetKey = insertModel.entityParents.findKey(parent => parent.get('index') === index);
                const existingParent = insertModel.entityParents.get(parentToResetKey);
                parentColumnName = this.createParentColumnName(existingParent);
                updatedModel = insertModel.mergeIn([
                    'entityParents',
                    parentToResetKey
                ], EntityParentType.create({
                    key: existingParent.key,
                    index,
                })) as EntityIdCreationModel;
            }

            this.setState(() => {
                return {
                    insertModel: updatedModel,
                }
            }, () => {

                if (column && existingParent) {
                    if (existingParent.query !== undefined) {
                        changeColumn(queryGridModel, this.createParentColumnName(existingParent), column);
                    }
                    else {
                        let columnMap = OrderedMap<string, QueryColumn>();
                        let fieldKey;
                        if (existingParent.index === 1)
                            fieldKey = this.getUniqueFieldKey();
                        else {
                            const definedParents = insertModel.entityParents.filter((parent) => parent.query !== undefined);
                            if (definedParents.size === 0)
                                fieldKey = this.getUniqueFieldKey();
                            else {
                                // want the first defined parent before the new parent's index
                                const prevParent = definedParents.findLast((parent) => parent.index < existingParent.index);
                                fieldKey = prevParent ? this.createParentColumnName(prevParent) : this.getUniqueFieldKey();
                            }
                        }
                        addColumns(queryGridModel, columnMap.set(column.fieldKey.toLowerCase(), column), fieldKey);
                    }
                }
                else {
                    removeColumn(queryGridModel,  parentColumnName);
                }
            })
        }
    }

    removeParent(index) {
        const { insertModel } = this.state;
        let parentToResetKey = insertModel.entityParents.findKey(parent => parent.get('index') === index);
        let parentColumnName = this.createParentColumnName(insertModel.entityParents.get(parentToResetKey));
        const entityParents = this.state.insertModel.entityParents
            .filter(parent => parent.index !== index)
            .map((parent, key) => parent.set('index', (key + 1)));

        const updatedModel = this.state.insertModel.merge({
            entityParents,
        }) as EntityIdCreationModel;
        this.setState(() => {
            return {
                insertModel: updatedModel,
            }
        }, () => {
            removeColumn(this.getQueryGridModel(),  parentColumnName);
        });
    }

    renderParentSelections() {
        const { insertModel } = this.state;

        if (insertModel) {
            const {isInit, targetEntityType, parentOptions, entityParents} = insertModel;

            if (isInit && targetEntityType) {
                return (
                    <>
                        {entityParents.map((parent) => {
                            const { index, key, query } = parent;
                            return (
                                <div className="form-group row" key={key}>
                                    <SelectInput
                                        formsy={false}
                                        containerClass=''
                                        inputClass="col-sm-5"
                                        label={"Parent " + index + " Type"}
                                        labelClass="col-sm-3 sample-insert--parent-label"
                                        name={"parent-re-select-" + index}
                                        onChange={this.changeParent.bind(this, index)}
                                        options={insertModel.getParentOptions(query)}
                                        value={query}
                                    />

                                    <RemoveEntityButton
                                        labelClass={'sample-insert--remove-parent'}
                                        entity="Parent"
                                        index={index}
                                        onClick={this.removeParent.bind(this, index)}/>
                                </div>
                            )
                        }).toArray()}
                        {parentOptions.size > entityParents.size ?
                            <div className="sample-insert--header">
                                <AddEntityButton
                                    entity="Parent"
                                    onClick={this.addParent}/>
                            </div> :
                            <div className="sample-insert--header">
                                Only {parentOptions.size} parent {parentOptions.size === 1 ? this.typeTextSingular : this.typeTextPlural} available.
                            </div>
                        }
                    </>
                );
            }
        }
    }

    renderHeader(isGrid: boolean) {
        const { insertModel } = this.state;

        if (!insertModel)
            return null;

        const name = insertModel.getTargetEntityTypeName();

        return (
            <>
                {isGrid && <div className="sample-insert--header">
                    <p>
                        Generate unique {this.props.nounPlural} individually or in bulk using the bulk insert option.
                    </p>
                </div>}
                {insertModel.isInit && (
                    <SelectInput
                        formsy={false}
                        inputClass="col-sm-5"
                        label={this.capTypeTextSingular}
                        labelClass="col-sm-3 col-xs-12 sample-insert--parent-label"
                        name="targetEntityType"
                        placeholder={'Select a ' + this.capTypeTextSingular + '...'}
                        onChange={this.changeTargetEntityType}
                        options={insertModel.entityTypeOptions.toArray()}
                        required
                        value={insertModel && insertModel.hasTargetEntityType() ? insertModel.targetEntityType.label : undefined}
                    />
                )}
                {insertModel.isError ? this.renderError() : (isGrid && insertModel.hasTargetEntityType() ? this.renderParentSelections() : '')}
            </>
        )
    }

    onRowCountChange = (rowCount: number) => {
        const { insertModel } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryModel.getId());
        if (editorModel) {
            this.setState(() => {
                return {
                    insertModel: insertModel.set('entityCount', editorModel.rowCount) as EntityIdCreationModel
                }
            });
            if (this.props.onDataChange) {
                this.props.onDataChange(editorModel.rowCount > 0, IMPORT_DATA_FORM_TYPES.GRID);
            }
        }
    };

    onCancel = () => {
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
                    insertModel: updatedModel
                }
            });
            queryGridInvalidate(updatedModel.getSchemaQuery());
            this.gridInit(updatedModel);
        }
    };

    setSubmitting(isSubmitting: boolean) {
        this.setState(() => ({isSubmitting}));
    }

    insertRowsFromGrid = () => {
        const { insertModel } = this.state;
        const queryGridModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryGridModel.getId());
        const errors =  editorModel.getValidationErrors(queryGridModel, this.getUniqueFieldKey());
        if (errors.length > 0) {
            this.setSubmitting(false);
            gridShowError(queryGridModel, {
                message: errors.join("  ")
            });
            return;
        }

        this.setSubmitting(true);
        insertModel.postEntityGrid(this.getQueryGridModel()).then((response: InsertRowsResponse) => {
            if (response && response.rows) {

                this.setSubmitting(false);
                if (this.props.onDataChange) {
                    this.props.onDataChange(false);
                }
                if (this.props.afterEntityCreation) {
                    this.props.afterEntityCreation(insertModel.getTargetEntityTypeName(), response.getFilter(), response.rows.length, 'created');
                }
            }
            else {
                this.setSubmitting(false);
                gridShowError(queryGridModel, {
                    message: 'Insert response has unexpected format. No "rows" available.'
                });
            }
        }).catch((response: InsertRowsResponse) => {
            this.setSubmitting(false);
            const message = resolveErrorMessage(response.error, this.props.nounPlural);
            gridShowError(queryGridModel, {
                message
            });
        });
    };

    deriveEntityIds = (count: number) => {
        const { insertModel } = this.state;
        this.setSubmitting(true);
        insertModel.deriveEntities(count, this.props.entityDataType).then((result: GenerateEntityResponse) => {
            this.setSubmitting(false);
            if (this.props.onDataChange) {
                this.props.onDataChange(false);
            }
            if (this.props.afterEntityCreation) {
                this.props.afterEntityCreation(insertModel.getTargetEntityTypeName(), result.getFilter(), result.data.materialOutputs.length, 'created');
            }
        }).catch((reason) => {
            this.setSubmitting(false);
            gridShowError(this.getQueryGridModel(), resolveErrorMessage(reason, count > 1 ? this.props.nounPlural : this.props.nounSingular));
        });
    };

    isNameRequired() {
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {
            return queryGridModel.isRequiredColumn(this.getUniqueFieldKey());
        }
        return false;
    }

    renderGridButtons() {
        const { insertModel, isSubmitting } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = queryModel ? getEditorModel(queryModel.getId()) : undefined;
        if (insertModel && insertModel.isInit) {
            const noun = insertModel.entityCount == 1 ? this.capNounSingular : this.capNounPlural;

            return (
                <div className="form-group no-margin-bottom">

                    <div className="pull-left">
                        <Button className={"test-loc-cancel-button"} onClick={this.onCancel}>Cancel</Button>
                    </div>
                    <div className="btn-group pull-right">
                        <Button
                            className={"test-loc-submit-button"}
                            bsStyle="success"
                            disabled={isSubmitting || insertModel.entityCount === 0 || !editorModel }
                            onClick={this.insertRowsFromGrid}
                            >
                            {isSubmitting ? "Creating..." : "Finish Creating " + insertModel.entityCount + " " + noun}
                        </Button>
                    </div>
                </div>
            );
        }
        return null;
    }

    renderError() {
        const { insertModel } = this.state;
        if (insertModel.isError) {
            return <Alert>{insertModel.errors ? insertModel.errors : 'Something went wrong loading the data for this page.  Please try again.'}</Alert>
        }
    }

    getBulkAddFormValues() {
        const { insertModel } = this.state;
        const queryGridModel = this.getQueryGridModel();

        if (!queryGridModel || !queryGridModel.queryInfo)
            return null;

        // format/process parent column and values, for now, only parents are populated
        const allRows = insertModel.getGridValues(queryGridModel.queryInfo);

        if (allRows.size > 0 ) {
            let valueMap = Map<string, any>();
            let values = '';
            let sep = '';
            const row = allRows.get(0); // for insert, use the first (and only) row data
            row.keySeq().forEach(col => {
                row
                    .get(col)
                    .forEach((val) => {
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

    onTabChange = () => {
        this.setState(() => ({error: undefined}));
    };

    renderCreateFromGrid() {
        const { insertModel } = this.state;

        const columnFilter = (colInfo) => {
            return insertColumnFilter(colInfo) && colInfo["fieldKey"] !== this.getUniqueFieldKey()
        };

        const bulkAddProps = {
            title: "Bulk Creation of " + this.capNounPlural,
            header: "Add a batch of " + this.props.nounPlural + " that will share the properties set below.",
            columnFilter: columnFilter,
            fieldValues: this.getBulkAddFormValues()
        };
        const bulkUpdateProps = {
            columnFilter: columnFilter
        };
        let addControlProps = {
            nounSingular: this.capNounSingular,
            nounPlural: this.capNounPlural,
            placement: 'top' as PlacementType,
            wrapperClass: 'pull-left',
            maxCount: MAX_EDITABLE_GRID_ROWS
        };
        let columnMetadata = Map<string, EditableColumnMetadata>();
        if (!this.isNameRequired()) {
            columnMetadata = columnMetadata.set(this.getUniqueFieldKey(), {
                readOnly: false,
                placeholder: "[generated id]",
                toolTip: "A generated " + this.props.nounSingular + " ID will be provided for " + this.props.nounPlural + " that don't have a user-provided ID in the grid."
            })
        } else {
            columnMetadata = columnMetadata.set(this.getUniqueFieldKey(), {
                toolTip: "A " + this.props.nounSingular + " ID is required for each " + this.props.nounSingular + " since this " + this.typeTextSingular + " has no naming pattern. You can provide a naming pattern by editing the " + this.typeTextSingular + " details."
            })
        }

        const queryGridModel = this.getQueryGridModel();

        return (<>
            {this.renderHeader(true)}
            <hr className={'bottom-spacing'}/>
            <div className={'top-spacing'}>
            {queryGridModel && queryGridModel.isLoaded ?
                <EditableGridPanel
                    addControlProps={addControlProps}
                    allowBulkRemove={true}
                    allowBulkAdd={true}
                    allowBulkUpdate={true}
                    bordered={true}
                    condensed={false}
                    striped={true}
                    bulkAddText={"Bulk Insert"}
                    bulkAddProps={bulkAddProps}
                    bulkUpdateProps={bulkUpdateProps}
                    bulkRemoveText={"Remove " + this.capNounPlural}
                    columnMetadata={columnMetadata}
                    onRowCountChange={this.onRowCountChange}
                    model={queryGridModel}
                    initialEmptyRowCount={0}
                    emptyGridMsg={'Start by adding the quantity of ' + this.props.nounPlural + ' you want to create.'}
                    maxTotalRows={this.props.maxEntities}
                />
                :
                !insertModel.isError && insertModel.targetEntityType && insertModel.targetEntityType.value ? <LoadingSpinner wrapperClassName="loading-data-message"/> : null
            }
            </div>
        </>);
    }

    toggleInsertOptionChange = () => {
        this.setState((state) => ({isMerge: !state.isMerge}));
    };

    importOptionHelpText = () => {
        return (
            <>
                <p>
                    By default, import will insert new {this.props.nounPlural} based on the file provided. The operation will fail if
                    there are existing {this.capIdsText} that match those being imported.
                </p>
                <p>
                    When update is selected, data will be updated for matching {this.capIdsText}, and new {this.props.nounPlural} will
                    be created for any new {this.capIdsText} provided. Data will not be changed for any columns not in the
                    imported file.
                </p>
                <p>
                    For more information on import options for {this.props.nounPlural}, see
                    the {this.props.importHelpLinkNode} documentation page.
                </p>
            </>
        );
    };

    renderImportOptions() {
        return (
            <div className={'margin-bottom'}>
                <input
                    type="checkbox"
                    checked={this.state.isMerge}
                    onChange={this.toggleInsertOptionChange}
                />
                <span
                    className={'sm-mergeoption-checkbox'}
                    onClick={this.toggleInsertOptionChange}
                >
                    Update data for existing {this.props.nounPlural} during this file import
                </span>
                &nbsp;
                <LabelHelpTip title={'Import Options'} body={this.importOptionHelpText}/>
            </div>
        )
    }

    handleFileChange = (files: Map<string, File>) => {
        if (this.props.onDataChange) {
            this.props.onDataChange(files.size > 0, IMPORT_DATA_FORM_TYPES.FILE);
        }
        this.setState(() => ({
            error: undefined,
            file: files.first()
        }));
    };

    handleFileRemoval = (attachmentName: string) => {
        if (this.props.onDataChange) {
            this.props.onDataChange(false, IMPORT_DATA_FORM_TYPES.FILE);
        }
        this.setState(() => ({
            error: undefined,
            file: undefined
        }));
    };

    submitFileHandler = () => {
        const { handleFileImport } = this.props;
        const { insertModel, file, isMerge, originalQueryInfo } = this.state;

        if (!handleFileImport)
            return;

        this.setSubmitting(true);

        handleFileImport(originalQueryInfo, file, isMerge).then((response) => {
            this.setSubmitting(false);
            if (this.props.onDataChange) {
                this.props.onDataChange(false);
            }
            if (this.props.afterEntityCreation) {
                this.props.afterEntityCreation(insertModel.getTargetEntityTypeName(), null, response.rowCount, 'imported');
            }

        }).catch((error) => {
            this.setState(() => ({
                error: resolveErrorMessage(error, this.props.nounPlural),
                isSubmitting: false
            }));
        });

    };

    renderFileButtons() {
        const { isSubmitting, file, originalQueryInfo } = this.state;

        return (
            <WizardNavButtons
                cancel={this.onCancel}
                containerClassName=""
                canFinish={file !== undefined && originalQueryInfo !== undefined}
                finish={true}
                nextStep={this.submitFileHandler} // nextStep is the function that will get called when finish button clicked
                isFinishing={isSubmitting}
                finishText={"Import"}
                isFinishingText={"Importing..."}
            />
        )
    }

    getTemplateUrl(): any {
        const { getFileTemplateUrl } = this.props;
        const { originalQueryInfo } = this.state;
        if (getFileTemplateUrl && originalQueryInfo)
            return getFileTemplateUrl(originalQueryInfo);

        return originalQueryInfo && Utils.isArray(originalQueryInfo.importTemplates)  && originalQueryInfo.importTemplates[0]
            ? originalQueryInfo.importTemplates[0].url : undefined;
    }

    renderImportEntitiesFromFile() {
        const { fileSizeLimits } = this.props;

        return (<>
            {this.renderHeader(false)}
            {this.renderImportOptions()}
            <FileAttachmentForm
                showLabel={false}
                acceptedFormats={".csv, .tsv, .txt, .xls, .xlsx"}
                allowMultiple={false}
                allowDirectories={false}
                previewGridProps={{previewCount: 3}}
                onFileChange={this.handleFileChange}
                onFileRemoval={this.handleFileRemoval}
                templateUrl={this.getTemplateUrl()}
                sizeLimits={fileSizeLimits}
                sizeLimitsHelpText={<>We recommend dividing your data into smaller files that meet this limit. See our {helpLinkNode(DATA_IMPORT_TOPIC, "help article")} for best practices on data import.</>}
            />
        </>);
    }

    renderButtons() {
        const { currentStep } = this.props;
        return currentStep === EntityInsertPanelTabs.Grid ? this.renderGridButtons() : this.renderFileButtons();
    }

    renderProgress() {
        const { currentStep } = this.props;
        const { insertModel, isSubmitting, file } = this.state;

        return currentStep === EntityInsertPanelTabs.Grid  ?
            <Progress
                estimate={insertModel.entityCount * 20}
                modal={true}
                title={"Generating " + this.props.nounPlural}
                toggle={isSubmitting}
            /> :
            <Progress
                estimate={file ? file.size * .1 : undefined}
                modal={true}
                title={"Importing " +  this.props.nounPlural + " from file"}
                toggle={isSubmitting}
            />
    }

    render() {
        const { canEditEntityTypeDetails } = this.props;
        const { insertModel, error } = this.state;

        if (!insertModel) {
            return <LoadingSpinner wrapperClassName="loading-data-message"/>;
        }

        const entityTypeName = insertModel.getTargetEntityTypeName();
        const editEntityTypeDetailsLink = entityTypeName ? AppURL.create(this.props.nounPlural, entityTypeName, 'update') : undefined;

        return (
            <>
                <div className={"panel panel-default"}>
                    <div className="panel-body">
                        <div className="row">
                            <div className={'import-panel col-sm-7'}>
                                <FormTabs tabs={this.getTabs()} onTabChange={this.onTabChange}/>
                            </div>
                            {editEntityTypeDetailsLink && canEditEntityTypeDetails ?
                                <div className={'col-sm-5'}><Link className={'pull-right sample-insert--link'} to={editEntityTypeDetailsLink.toString()}>Edit {this.capNounSingular} Type Details</Link></div>
                                : undefined}
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <FormStep stepIndex={EntityInsertPanelTabs.Grid}>
                                    {this.renderCreateFromGrid()}
                                </FormStep>
                                <FormStep stepIndex={EntityInsertPanelTabs.File}>
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
        )
    }
}

export const EntityInsertPanel = withFormSteps(EntityInsertPanelImpl, {
    currentStep: EntityInsertPanelTabs.Grid,
    furthestStep: EntityInsertPanelTabs.File,
    hasDependentSteps: false
});
