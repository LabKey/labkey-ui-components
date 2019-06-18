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
import {List, Record, fromJS} from "immutable";
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    DOUBLE_RANGE_URI, FILELINK_RANGE_URI, FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI, PARTICIPANTID_CONCEPT_URI, STRING_RANGE_URI,
    USER_RANGE_URI
} from "./constants";

interface IPropDescType{
    name: string,
    display?: string,
    rangeURI?: string,
    conceptURI?: string
}

export class PropDescType extends Record({
    name: '',
    display: '',
    rangeURI: '',
    conceptURI: ''
}) implements IPropDescType {
    name: string;
    display: string;
    rangeURI: string;
    conceptURI: string;

    static isLookup(name: string): boolean {
        return name === 'lookup';
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    isLookup(): boolean {
        return PropDescType.isLookup(this.name);
    }
}

export const PROP_DESC_TYPES = List([
    new PropDescType({name: 'string', display: 'Text (String)', rangeURI: STRING_RANGE_URI}),
    new PropDescType({name: 'multiLine', display: 'Multi-Line Text', rangeURI: MULTILINE_RANGE_URI}),
    new PropDescType({name: 'boolean', display: 'Boolean', rangeURI: BOOLEAN_RANGE_URI}),
    new PropDescType({name: 'int', display: 'Integer', rangeURI: INT_RANGE_URI}),
    new PropDescType({name: 'double', display: 'Number (Double)', rangeURI: DOUBLE_RANGE_URI}),
    new PropDescType({name: 'dateTime', display: 'Date Time', rangeURI: DATETIME_RANGE_URI}),
    new PropDescType({name: 'flag', display: 'Flag (String)', rangeURI: STRING_RANGE_URI, conceptURI: FLAG_CONCEPT_URI}),
    new PropDescType({name: 'fileLink', display: 'File', rangeURI: FILELINK_RANGE_URI}),
    new PropDescType({name: 'attachment', display: 'Attachment', rangeURI: ATTACHMENT_RANGE_URI}),
    new PropDescType({name: 'users', display: 'User', rangeURI: USER_RANGE_URI}),
    new PropDescType({name: 'ParticipantId', display: 'Subject/Participant (String)', rangeURI: STRING_RANGE_URI, conceptURI: PARTICIPANTID_CONCEPT_URI}),
    new PropDescType({name: 'lookup', display: 'Lookup'}),
]);

interface IDomainDesign {
    name: string
    description?: string
    domainURI: string
    domainId: number
    fields?: List<DomainField>
    indices?: List<DomainIndex>
}

export class DomainDesign extends Record({
    name: undefined,
    description: undefined,
    domainURI: undefined,
    domainId: null,
    fields: List<DomainField>(),
    indices: List<DomainIndex>()
}) implements IDomainDesign {
    name: string;
    description: string;
    domainURI: string;
    domainId: number;
    fields: List<DomainField>;
    indices: List<DomainIndex>;

    static create(rawModel): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();

        if (rawModel) {
            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields);
            }

            if (rawModel.indices) {
                indices = DomainIndex.fromJS(rawModel.indices);
            }
        }

        return new DomainDesign({
            ...rawModel,
            fields,
            indices
        })
    }

    static serialize(dd: DomainDesign): any {
        let json = dd.toJS();
        json.fields = dd.fields.map(DomainField.serialize).toArray();
        return json;
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainIndex {
    columns: Array<string> | List<string>
    type: 'primary' | 'unique'
}

export class DomainIndex extends Record({
    columns: List<string>(),
    type: undefined
}) implements IDomainIndex {
    columns: List<string>;
    type: 'primary' | 'unique';

    static fromJS(rawIndices: Array<IDomainIndex>): List<DomainIndex> {
        let indices = List<DomainIndex>().asMutable();

        for (let i=0; i < rawIndices.length; i++) {
            indices.push(new DomainIndex(fromJS(rawIndices[i])));
        }

        return indices.asImmutable();
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainField {
    name?: string
    rangeURI?: string
    propertyId?: number
    propertyURI?: string
    description?: string
    label?: string
    conceptURI?: string
    required?: boolean
    lookupContainer?: string
    lookupSchema?: string
    lookupQuery?: string
    scale?: number
    importAliases?: string
    URL?: string
    hidden?: boolean
    userEditable?: boolean
    shownInInsertView?: boolean
    shownInUpdateView?: boolean

    dataType?: PropDescType
    updatedField?: boolean
    newField?: boolean
}

export class DomainField extends Record({
    propertyId: undefined,
    propertyURI: undefined,
    name: '',
    description: undefined,
    label: undefined,
    rangeURI: STRING_RANGE_URI,
    conceptURI: undefined,
    required: false,
    lookupContainer: undefined,
    lookupSchema: undefined,
    lookupQuery: undefined,
    scale: undefined,
    importAliases: undefined,
    URL: undefined,

    dataType: undefined,
    updatedField: undefined,
    newField: undefined,
}) implements IDomainField {
    propertyId: number;
    propertyURI: string;
    name: string;
    description: string;
    label: string;
    rangeURI: string;
    conceptURI: string;
    required: boolean;
    lookupContainer: string;
    lookupSchema: string;
    lookupQuery: string;
    scale: number;
    importAliases: string;
    URL: string;

    dataType: PropDescType;
    updatedField: boolean;
    newField: boolean;

    static create(rawField: IDomainField): DomainField {
        return new DomainField(Object.assign({}, {
            dataType: resolveDataType(rawField)
        }, rawField));
    }

    static fromJS(rawFields: Array<IDomainField>): List<DomainField> {
        let fields = List<DomainField>().asMutable();

        for (let i=0; i < rawFields.length; i++) {
            fields.push(DomainField.create(rawFields[i]));
        }

        return fields.asImmutable();
    }

    static serialize(df: DomainField): any {
        let json = df.toJS();

        // remove non-serializable fields
        delete json.dataType;
        delete json.newField;
        delete json.updatedField;

        return json;
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

function resolveDataType(rawField: IDomainField): PropDescType {
    const types = PROP_DESC_TYPES.filter((value) => {

        // handle matching rangeURI and conceptURI
        if (value.rangeURI === rawField.rangeURI) {
            if (!rawField.lookupQuery &&
                ((!value.conceptURI && !rawField.conceptURI) || (value.conceptURI === rawField.conceptURI)))
            {
                return true;
            }
        }
        // handle selected lookup option
        else if (value.name === 'lookup' && rawField.lookupQuery && rawField.lookupQuery !== 'users') {
            return true;
        }
        // handle selected users option
        else if (value.name === 'users' && rawField.lookupQuery && rawField.lookupQuery === 'users') {
            return true;
        }

        return false;
    });

    // If found return type
    if (types.size > 0) {
        return types.get(0);
    }

    // default to the text type
    return PROP_DESC_TYPES.get(0);
}

interface IQueryInfoLite {
    canEdit?: boolean
    canEditSharedViews?: boolean
    description?: string
    hidden?: boolean
    inherit?: boolean
    isInherited?: boolean
    isMetadataOverrideable?: boolean
    isUserDefined?: boolean
    name?: string
    snapshot?: false
    title?: string
    viewDataUrl?: string
}

export class QueryInfoLite extends Record({
    canEdit: false,
    canEditSharedViews: false,
    description: undefined,
    hidden: false,
    inherit: false,
    isInherited: false,
    isMetadataOverrideable: false,
    isUserDefined: false,
    name: undefined,
    snapshot: false,
    title: undefined,
    viewDataUrl: undefined
}) implements IQueryInfoLite {
    canEdit?: boolean;
    canEditSharedViews?: boolean;
    description?: string;
    hidden?: boolean;
    inherit?: boolean;
    isInherited?: boolean;
    isMetadataOverrideable?: boolean;
    isUserDefined?: boolean;
    name?: string;
    snapshot?: false;
    title?: string;
    viewDataUrl?: string;

    static create(raw: IQueryInfoLite): QueryInfoLite {
        return new QueryInfoLite(raw);
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}