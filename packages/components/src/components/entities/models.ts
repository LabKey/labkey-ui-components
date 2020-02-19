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
import { Ajax, Filter, Utils } from '@labkey/api';
import { List, Map, OrderedMap, Record } from 'immutable';
import { Option } from 'react-select';

import { getEditorModel } from '../../global';
import { insertRows } from '../../query/api';
import { gridShowError } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, QueryGridModel, QueryInfo, SchemaQuery } from '../base/models/model';
import { capitalizeFirstChar, generateId } from '../../util/utils';
import { buildURL } from '../../url/ActionURL';
import { EntityDataType } from './constants';
import { IEntityDetails } from '../domainproperties/entities/models';

export interface EntityInputProps {
    role: string
    rowId: number
}

export interface IDerivePayload {
    dataInputs?: Array<EntityInputProps>
    materialDefault?: any
    materialInputs?: Array<EntityInputProps>
    materialOutputCount?: number
    materialOutputs?: Array<{[key: string]: any}>
    targetType: string
}

export interface IParentOption extends Option {
    query?: string
    schema?: string
}

export interface DisplayObject {
    displayValue: any,
    value: any
}

export class EntityParentType extends Record({
    index: undefined,
    key: undefined,
    query: undefined,
    schema: undefined,
    value: undefined,
}) {
    index: number;
    key: string;
    query: string;
    schema: string;
    value: List<DisplayObject>;

    constructor(values?: any) {
        super(values);
    }

    static create(values: any) {
        if (!values.key)
            values.key = generateId('parent-type-');
        return new EntityParentType(values);
    }

    createColumnName() {
        const parentInputType = this.getInputType();
        const formattedQueryName = capitalizeFirstChar(this.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        return [parentInputType, formattedQueryName].join('/');
    }

    getInputType(): string {
        return this.schema === SCHEMAS.DATA_CLASSES.SCHEMA ? QueryColumn.DATA_INPUTS : QueryColumn.MATERIAL_INPUTS;
    }

    // TODO: We should stop generating this on the client and retrieve the actual ColumnInfo from the server
    generateColumn(displayColumn: string): QueryColumn {
        const parentInputType = this.getInputType();
        const formattedQueryName = capitalizeFirstChar(this.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        const parentColName = [parentInputType, formattedQueryName].join('/');

        // 32671: Sample import and edit grid key ingredients on scientific name
        if (this.schema && this.query &&
            this.schema.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName.toLowerCase() &&
            this.query.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName.toLowerCase()) {
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
                queryName: this.query,
                schemaName: this.schema,
                table: parentInputType
            },
            name: parentColName,
            required: false,
            shownInInsertView: true,
            type: 'Text (String)',
            userEditable: true
        });
    }
}

export interface IEntityTypeOption extends Option {
    lsid: string
    rowId: number
}

export class EntityTypeOption implements IEntityTypeOption {
    label: string;
    lsid: string;
    rowId: number;
    value: any;

    constructor(props?: Partial<EntityTypeOption>) {
        if (props) {
            for (let k in props) {
                this[k] = props[k];
            }
        }
    }
}

interface MaterialOutput {
    created: any
    createdBy: string
    id: number
    lsid: string
    modified: any
    modifiedBy: string
    name: string
    properties: any
    sampleSet: any
}

export class GenerateEntityResponse extends Record( {
    data: undefined,
    message: undefined,
    success: false
}) {

    data: {
        materialOutputs: Array<MaterialOutput>
        [key: string]: any
    };
    message: string;
    success: boolean;

    constructor(values?: any) {
        super(values);
    }

    // Get all of the rowIds of the newly generated entity Ids (or the runs)
    getFilter(): Filter.IFilter {
        let filterColumn: string,
            filterValue;

        // data.id is the run rowId. If provided, create a filter based off the run instead of entityIds.
        if (this.data.id) {
            filterColumn = 'Run/RowId';
            filterValue = [this.data.id];

        } else {
            filterColumn = 'RowId';

            // if a run id was not included, filter based on generated entity Ids.
            filterValue = this.data.materialOutputs.map(val => val.id);
        }

        return Filter.create(filterColumn, filterValue, Filter.Types.IN);
    }
}

export class EntityIdCreationModel extends Record({
    errors: undefined,
    initialEntityType: undefined,
    isError: false,
    isInit: false,
    originalParents: Array<string>(),
    parentOptions: Map<string, List<IParentOption>>(),
    entityParents: Map<string, List<EntityParentType>>(),
    entityTypeOptions: List<IEntityTypeOption>(),
    selectionKey: undefined,
    targetEntityType: undefined,
    entityCount: 0,
    entityDataType: EntityDataType.Sample
}) {
    errors: Array<any>;
    initialEntityType: any;
    isError: boolean;
    isInit: boolean;
    originalParents: Array<string>; // taken from the query string
    parentOptions: Map<string, List<IParentOption>>; // map from query name to the options for the different types of parents allowed
    entityParents:  Map<string, List<EntityParentType>>; // map from query name to the parents already selected for that query
    entityTypeOptions: List<IEntityTypeOption>; // the target type options
    selectionKey: string;
    targetEntityType: EntityTypeOption; // the target entity Type
    entityCount: number; // how many rows are in the grid
    entityDataType: EntityDataType; // target entity data type

    constructor(values?: any) {
        super(values);
    }

    static revertParentInputSchema(inputColumn: QueryColumn): SchemaQuery {
        if (inputColumn.isExpInput()) {
            const fieldKey = inputColumn.fieldKey.toLowerCase().split('/');
            if (fieldKey.length === 2) {
                let schemaName: string;
                if (fieldKey[0] === QueryColumn.DATA_INPUTS.toLowerCase()) {
                    schemaName = SCHEMAS.DATA_CLASSES.SCHEMA;
                }
                else if (fieldKey[0] === QueryColumn.MATERIAL_INPUTS.toLowerCase()) {
                    schemaName = SCHEMAS.SAMPLE_SETS.SCHEMA;
                }
                else {
                    throw new Error('Invalid inputColumn fieldKey. "' + fieldKey[0] + '"');
                }

                return SchemaQuery.create(schemaName, fieldKey[1]);
            }

            throw new Error('invalid inputColumn fieldKey length.');
        }

        throw new Error('Invalid inputColumn.');
    }

    getParentColumns(uniqueFieldKey: string) : OrderedMap<string, QueryColumn> {
        let columns = OrderedMap<string, QueryColumn>();
        this.entityParents.forEach((parentList) => {
            parentList.forEach((parent) => {
                if (parent.schema && parent.query) {
                    const column = parent.generateColumn(uniqueFieldKey);
                    // Issue 33653: query name is case-sensitive for some data inputs (parents)
                    columns = columns.set(column.name.toLowerCase(), column);
                }
            })
        });
        return columns;
    }

    addParent(queryName: string) : EntityIdCreationModel {
        const nextIndex = this.entityParents.get(queryName).size + 1;
        const updatedParents = this.entityParents.get(queryName).push(EntityParentType.create({index: nextIndex}));
        return this.setIn(['entityParents', queryName], updatedParents) as EntityIdCreationModel
    }

    removeParent(index: number, queryName: string) : [EntityIdCreationModel, string] {
        const entityParents = this.entityParents.get(queryName);
        let parentToResetKey = entityParents.findKey(parent => parent.get('index') === index);
        let parentColumnName = entityParents.get(parentToResetKey).createColumnName();
        const updatedEntityParents = entityParents
            .filter(parent => parent.index !== index)
            .map((parent, key) => parent.set('index', (key + 1)));
        return [
            this.setIn(['entityParents', queryName], updatedEntityParents) as EntityIdCreationModel,
            parentColumnName
        ];
    }

    changeParent(index: number, queryName: string, uniqueFieldKey: string,  parent: IParentOption) : [EntityIdCreationModel, QueryColumn, EntityParentType, string] {
        let column;
        let parentColumnName;
        let existingParent;
        const entityParents = this.entityParents.get(queryName);
        let updatedModel;
        if (parent) {
            const existingParentKey = entityParents.findKey(parent => parent.get('index') === index);
            existingParent = entityParents.get(existingParentKey);

            // bail out if the selected parent is the same as the existingParent for this index, i.e. nothing changed
            const schemaMatch = parent && existingParent && Utils.caseInsensitiveEquals(parent.schema, existingParent.schema);
            const queryMatch = parent && existingParent && Utils.caseInsensitiveEquals(parent.query, existingParent.query);
            if (schemaMatch && queryMatch) {
                return [undefined, undefined, existingParent, undefined];
            }

            const parentType = EntityParentType.create({
                index,
                key: existingParent.key,
                query: parent.query,
                schema: parent.schema
            });
            updatedModel = this.mergeIn([
                'entityParents',
                queryName,
                existingParentKey
            ], parentType) as EntityIdCreationModel;
            column = parentType.generateColumn(uniqueFieldKey);
        }
        else {
            let parentToResetKey = entityParents.findKey(parent => parent.get('index') === index);
            const existingParent = entityParents.get(parentToResetKey);
            parentColumnName = existingParent.createColumnName();
            updatedModel = this.mergeIn([
                'entityParents',
                queryName,
                parentToResetKey
            ], EntityParentType.create({
                key: existingParent.key,
                index,
            })) as EntityIdCreationModel;
        }
        return [
            updatedModel,
            column,
            existingParent,
            parentColumnName
        ]
    }

    hasTargetEntityType() : boolean {
        return this.targetEntityType && this.targetEntityType.value
    }

    getTargetEntityTypeName() : string {
        return this.hasTargetEntityType() ? this.targetEntityType.value : undefined;
    }

    getParentCount() : number {
        return this.entityParents.reduce((count: number, parentList) => {
            return count + parentList.filter((parent) => parent.query !== undefined).count()
        }, 0);
    }

    getEntityInputs(): {
        dataInputs: Array<EntityInputProps>,
        materialInputs: Array<EntityInputProps>
    } {
        let dataInputs: Array<EntityInputProps> = [];
        this.entityParents.get(SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName).forEach((parent, index) => {
            const role =  'data';

            parent.value.forEach((option) => {
                const rowId = parseInt(option.value);
                if (!isNaN(rowId)) {
                    dataInputs.push({role, rowId});
                }
                else {
                    console.warn('Unable to parse rowId from "' + option.value + '" for ' + role + '.');
                }
            });
        });
        let materialInputs: Array<EntityInputProps> = [];
        this.entityParents.get(SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName).forEach((parent, index) => {
            const role =  'sample';

            parent.value.forEach((option) => {
                const rowId = parseInt(option.value);
                if (!isNaN(rowId)) {
                    materialInputs.push({role, rowId});
                }
                else {
                    console.warn('Unable to parse rowId from "' + option.value + '" for ' + role + '.');
                }
            });
        });

        return {
            dataInputs,
            materialInputs
        }
    }

    getSaveValues(): IDerivePayload {
        const { dataInputs, materialInputs } = this.getEntityInputs();

        let materialDefault = {};

        return {
            dataInputs,
            materialDefault,
            materialInputs,
            targetType: this.targetEntityType.lsid
        };
    }

    getParentOptions(currentSelection: string, queryName: string): Array<any> {
        // exclude options that have already been selected, except the current selection for this input
        return this.parentOptions.get(queryName)
            .filter(o => (
                this.entityParents.get(queryName).every(parent => {
                    const notParentMatch = !parent.query || !Utils.caseInsensitiveEquals(parent.query, o.value);
                    const matchesCurrent = currentSelection && Utils.caseInsensitiveEquals(currentSelection, o.value);
                    return notParentMatch || matchesCurrent;
                })
            ))
            .toArray();
    }

    // Make the call to the Derive API
    deriveEntities(entityOutputCount: number, entityDataType: EntityDataType): Promise<GenerateEntityResponse> {
        const { dataInputs, materialInputs, materialOutputs,  materialDefault, targetType } = this.getSaveValues();

        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('experiment', 'derive.api'),
                jsonData: {
                    dataInputs,
                    materialInputs,
                    targetSampleSet: entityDataType === EntityDataType.Sample ? targetType : undefined,
                    targetDataClass: entityDataType === EntityDataType.DataClass ? targetType : undefined,
                    materialOutputCount : entityDataType === EntityDataType.Sample ? entityOutputCount : undefined,
                    dataOutputCount : entityDataType === EntityDataType.DataClass ? entityOutputCount : undefined,
                    materialOutputs,
                    materialDefault
                },
                success: Utils.getCallbackWrapper((response) => {
                    resolve(new GenerateEntityResponse(response));
                }),
                failure: Utils.getCallbackWrapper((error) => {
                    console.error(error);
                    reject(error);
                })
            });
        });
    }

    getSchemaQuery() {
        const entityTypeName = this.getTargetEntityTypeName();
        return entityTypeName ? SchemaQuery.create(this.entityDataType === EntityDataType.Sample ? SCHEMAS.SAMPLE_SETS.SCHEMA : SCHEMAS.DATA_CLASSES.SCHEMA, entityTypeName) : undefined;
    }

    postEntityGrid(queryGridModel: QueryGridModel) : Promise<any>  {
        const editorModel = getEditorModel(queryGridModel.getId());
        if (!editorModel) {
            gridShowError(queryGridModel, {
                message: 'Grid does not expose an editor. Ensure the grid is properly initialized for editing.'
            });
            return;
        }

        const rows = editorModel.getRawData(queryGridModel).valueSeq()
            .reduce((rows, row) => rows.push(row.toMap()), List<Map<string, any>>());

        // TODO: InsertRows responses are fragile and depend heavily on shape of data uploaded
        return insertRows({
            fillEmptyFields: true,
            schemaQuery : this.getSchemaQuery(),
            rows
        })
    };

    getGridValues(queryInfo: QueryInfo): Map<any, any> {
        let data = List<Map<string, any>>();

        for (let i = 0; i < this.entityCount; i++) {
            let values = Map<string, any>();

            queryInfo
                .getInsertColumns()
                .forEach((col) => {
                    const colName = col.name;

                    if (col.isExpInput()) {
                        // Convert parent values into appropriate column names
                        const sq = EntityIdCreationModel.revertParentInputSchema(col);

                        // should be only one parent with the matching schema and query name
                        const selected = this.entityParents.reduce((found, parentList) => {
                            return found || parentList.find((parent) => parent.schema === sq.schemaName && parent.query === sq.queryName)
                        }, undefined);
                        if (selected && selected.value) {
                            values = values.set(colName, selected.value);
                        }
                    }
                });

            data = data.push(values);
        }

        return data.toOrderedMap();
    }
}

export interface IEntityTypeDetails extends IEntityDetails {
    importAliasKeys?: Array<string>
    importAliasValues?: Array<string>
}

export interface IParentAlias {
    alias: string;
    id: string; //generated by panel used for removal, not saved
    parentValue: IParentOption;
    ignoreAliasError: boolean
    ignoreSelectError: boolean
}

export const enum EntityInsertPanelTabs {
    Grid = 1,
    File = 2
}
