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
import { List, Map, Record } from 'immutable';
import { Option } from 'react-select';

import { getEditorModel } from '../../global';
import { insertRows } from '../../query/api';
import { gridShowError } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, QueryGridModel, QueryInfo, SchemaQuery } from '../base/models/model';
import { generateId } from '../../util/utils';
import { buildURL } from '../../url/ActionURL';

export interface SampleInputProps {
    role: string
    rowId: number
}

export interface IDerivePayload {
    dataInputs?: Array<SampleInputProps>
    materialDefault?: any
    materialInputs?: Array<SampleInputProps>
    materialOutputCount?: number
    materialOutputs?: Array<{[key: string]: any}>
    targetSampleSet: string
}

export interface IParentOption extends Option {
    query?: string
    schema?: string
}

export interface DisplayObject {
    displayValue: any,
    value: any
}

export class SampleSetParentType extends Record({
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
        return new SampleSetParentType(values);
    }
}

export interface ISampleSetOption extends Option {
    lsid: string
    rowId: number
}

export class SampleSetOption implements ISampleSetOption {
    label: string;
    lsid: string;
    rowId: number;
    value: any;

    constructor(props?: Partial<SampleSetOption>) {
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

export class GenerateSampleResponse extends Record( {
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

    // Get all of the rowIds of the newly generated sampleIds (or the runs)
    getFilter(): Filter.IFilter {
        let filterColumn: string,
            filterValue;

        // data.id is the run rowId. If provided, create a filter based off the run instead of sampleIds.
        if (this.data.id) {
            filterColumn = 'Run/RowId';
            filterValue = [this.data.id];

        } else {
            filterColumn = 'RowId';

            // if a run id was not included, filter based on generated sample Ids.
            filterValue = this.data.materialOutputs.map(val => val.id);
        }

        return Filter.create(filterColumn, filterValue, Filter.Types.IN);
    }
}

export class SampleIdCreationModel extends Record({
    errors: undefined,
    initialSampleSet: undefined,
    isError: false,
    isInit: false,
    parents: Array<string>(),
    parentOptions: List<IParentOption>(),
    sampleParents: List<SampleSetParentType>(),
    sampleSetData: Map<string, any>(),
    sampleSetOptions: List<ISampleSetOption>(),
    selectionKey: undefined,
    targetSampleSet: undefined,
    sampleCount: 0
}) {
    errors: Array<any>;
    initialSampleSet: any;
    isError: boolean;
    isInit: boolean;
    parents: Array<string>; // TODO should be 'originalParents'
    parentOptions: List<IParentOption>;
    sampleParents: List<SampleSetParentType>;
    sampleSetData: Map<string, any>;
    sampleSetOptions: List<ISampleSetOption>;
    selectionKey: string;
    targetSampleSet: SampleSetOption;
    sampleCount: number;

    constructor(values?: any) {
        super(values);
    }

    hasTargetSampleSet() : boolean {
        return this.targetSampleSet && this.targetSampleSet.value
    }

    getTargetSampleSetName() : string {
        return this.hasTargetSampleSet() ? this.targetSampleSet.value : undefined;
    }

    getSampleInputs(): {
        dataInputs: Array<SampleInputProps>,
        materialInputs: Array<SampleInputProps>
    } {
        let dataInputs: Array<SampleInputProps> = [],
            materialInputs: Array<SampleInputProps> = [];

        this.sampleParents.forEach((parent, index) => {
            if (parent.value) {
                const isData = parent.schema === SCHEMAS.DATA_CLASSES.SCHEMA;
                const isSample = parent.schema === SCHEMAS.SAMPLE_SETS.SCHEMA;

                if (isData || isSample) {
                    const role = isData ? 'data' : 'sample';

                    parent.value.forEach((option) => {
                        const rowId = parseInt(option.value);
                        if (!isNaN(rowId)) {
                            const input = {role, rowId};

                            if (isData) {
                                dataInputs.push(input);
                            }
                            else {
                                materialInputs.push(input);
                            }
                        }
                        else {
                            console.warn('SampleSet/actions/getSampleInputs -- Unable to parse rowId from "' + option.value + '" for ' + role + '.');
                        }
                    });
                }
            }
        });

        return {
            dataInputs,
            materialInputs
        }
    }

    getSaveValues(): IDerivePayload {
        const { dataInputs, materialInputs } = this.getSampleInputs();

        let materialDefault = {};

        return {
            dataInputs,
            materialDefault,
            materialInputs,
            targetSampleSet: this.targetSampleSet.lsid
        };
    }

    getParentOptions(currentSelection: string): Array<any> {
        // exclude options that have already been selected, except the current selection for this input
        return this.parentOptions
            .filter(o => (
                this.sampleParents.every(parent => {
                    const notParentMatch = !parent.query || !Utils.caseInsensitiveEquals(parent.query, o.value);
                    const matchesCurrent = currentSelection && Utils.caseInsensitiveEquals(currentSelection, o.value);
                    return notParentMatch || matchesCurrent;
                })
            ))
            .toArray();
    }

    // Make the call to the Derive API
    deriveSamples(materialOutputCount: number): Promise<GenerateSampleResponse> {
        const { dataInputs, materialInputs, materialOutputs,  materialDefault, targetSampleSet } = this.getSaveValues();

        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('experiment', 'derive.api'),
                jsonData: {
                    dataInputs,
                    materialInputs,
                    targetSampleSet,
                    materialOutputCount,
                    materialOutputs,
                    materialDefault
                },
                success: Utils.getCallbackWrapper((response) => {
                    resolve(new GenerateSampleResponse(response));
                }),
                failure: Utils.getCallbackWrapper((error) => {
                    reject(error);
                })
            });
        });
    }

    getSchemaQuery() {
        const sampleSetName = this.getTargetSampleSetName();
        return sampleSetName ? SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSetName) : undefined;
    }


    postSampleGrid(queryGridModel: QueryGridModel) : Promise<any>  {
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
                    throw new Error('SampleIdCreationModel.models.revertParentInputSchema -- invalid inputColumn fieldKey. "' + fieldKey[0] + '"');
                }

                return SchemaQuery.create(schemaName, fieldKey[1]);
            }

            throw new Error('SampleIdCreationModel.models.revertParentInputSchema -- invalid inputColumn fieldKey length.');
        }

        throw new Error('SampleIdCreationModel.models.revertParentInputSchema -- invalid inputColumn.');
    }

    getGridValues(queryInfo: QueryInfo): Map<any, any> {
        let data = List<Map<string, any>>();

        for (let i = 0; i < this.sampleCount; i++) {
            let values = Map<string, any>();

            queryInfo
                .getInsertColumns()
                .forEach((col) => {
                    const colName = col.name;

                    if (col.isExpInput()) {
                        // Convert parent values into appropriate column names
                        const sq = SampleIdCreationModel.revertParentInputSchema(col);

                        // should be only one parent with the matching schema and query name
                        const selected = this.sampleParents.find((parent) => parent.schema === sq.schemaName && parent.query === sq.queryName);
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

export interface ISampleSetDetails {
    isUpdate?: boolean
    rowId?: number
    name?: string
    nameExpression?: string
    description?: string
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

export const enum SampleInsertPanelTabs {
    Grid = 1,
    File = 2
}
