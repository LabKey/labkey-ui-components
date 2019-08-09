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
import { List, Record, fromJS } from "immutable";
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI, DOMAIN_FIELD_NOT_LOCKED,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    STRING_RANGE_URI,
    USER_RANGE_URI
} from "./constants";
import {createFormInputName, getIndexFromId} from "./actions/actions";

export interface IFieldChange {
    id: string,
    value: any
}

export interface ITypeDependentProps {
    index: number,
    label: string,
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any
    lockType: string
}

interface IPropDescType {
    conceptURI: string
    display: string
    name: string
    rangeURI: string
    shortDisplay?: string
}

export class PropDescType extends Record({
    conceptURI: undefined,
    display: undefined,
    name: undefined,
    rangeURI: undefined,
    shortDisplay: undefined
}) implements IPropDescType {
    conceptURI: string;
    display: string;
    name: string;
    rangeURI: string;
    shortDisplay: string;

    static isLookup(name: string): boolean {
        return name === 'lookup';
    }

    static isInteger(rangeURI: string): boolean {
        return (rangeURI === INT_RANGE_URI || rangeURI === USER_RANGE_URI);
    }

    static isString(rangeURI: string): boolean {
        return (rangeURI === STRING_RANGE_URI || rangeURI === MULTILINE_RANGE_URI);
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    isLookup(): boolean {
        return PropDescType.isLookup(this.name);
    }

    isInteger(): boolean {
        return PropDescType.isInteger(this.rangeURI);
    }

    isString(): boolean {
        return PropDescType.isString(this.rangeURI);
    }
}

const TEXT_TYPE = new PropDescType({name: 'string', display: 'Text (String)', rangeURI: STRING_RANGE_URI, shortDisplay: 'String'});
const LOOKUP_TYPE = new PropDescType({name: 'lookup', display: 'Lookup'});

export const PROP_DESC_TYPES = List([
    TEXT_TYPE,
    new PropDescType({name: 'multiLine', display: 'Multi-Line Text', rangeURI: MULTILINE_RANGE_URI}),
    new PropDescType({name: 'boolean', display: 'Boolean', rangeURI: BOOLEAN_RANGE_URI}),
    new PropDescType({name: 'int', display: 'Integer', rangeURI: INT_RANGE_URI}),
    new PropDescType({name: 'double', display: 'Decimal', rangeURI: DOUBLE_RANGE_URI}),
    new PropDescType({name: 'dateTime', display: 'Date Time', rangeURI: DATETIME_RANGE_URI}),
    new PropDescType({name: 'flag', display: 'Flag (String)', rangeURI: STRING_RANGE_URI, conceptURI: FLAG_CONCEPT_URI}),
    new PropDescType({name: 'fileLink', display: 'File', rangeURI: FILELINK_RANGE_URI}),
    new PropDescType({name: 'attachment', display: 'Attachment', rangeURI: ATTACHMENT_RANGE_URI}),
    new PropDescType({name: 'users', display: 'User', rangeURI: USER_RANGE_URI}),
    new PropDescType({name: 'ParticipantId', display: 'Subject/Participant (String)', rangeURI: STRING_RANGE_URI, conceptURI: PARTICIPANTID_CONCEPT_URI}),
    LOOKUP_TYPE
]);

interface IDomainDesign {
    name: string
    description?: string
    domainURI: string
    domainId: number
    fields?: List<DomainField>
    indices?: List<DomainIndex>
    domainException?: DomainException
}

export class DomainDesign extends Record({
    name: undefined,
    description: undefined,
    domainURI: undefined,
    domainId: null,
    fields: List<DomainField>(),
    indices: List<DomainIndex>(),
    domainException: undefined
}) implements IDomainDesign {
    name: string;
    description: string;
    domainURI: string;
    domainId: number;
    fields: List<DomainField>;
    indices: List<DomainIndex>;
    domainException: DomainException;

    static create(rawModel, exception): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();
        let domainException = DomainException.create(exception, (exception ? exception.severity : undefined));

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
            indices,
            domainException
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

    hasErrors(): boolean {
        return this.fields.find((f) => f.hasErrors()) !== undefined;
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

export enum FieldErrors {
    NONE,
    MISSING_SCHEMA_QUERY
}

// Commented out properties are unused
export interface IDomainField {
    conceptURI?: string
    defaultScale?: string
    description?: string
    excludeFromShifting?: boolean
    format?: string
    hidden?: boolean
    importAliases?: string
    label?: string
    lookupContainer?: string
    lookupQuery?: string
    lookupSchema?: string
    name: string
    primaryKey?: boolean
    propertyId?: number
    propertyURI: string
    rangeURI: string
    required?: boolean
    scale?: number
    URL?: string
    shownInInsertView?: boolean
    shownInUpdateView?: boolean

    dataType: PropDescType
    lookupQueryValue: string;
    lookupType: PropDescType
    original: Partial<IDomainField>
    updatedField: boolean
    isPrimaryKey: boolean
    lockType: string
}

export class DomainField extends Record({
    conceptURI: undefined,
    defaultScale: undefined,
    description: undefined,
    excludeFromShifting: false,
    format: undefined,
    hidden: false,
    importAliases: undefined,
    label: undefined,
    lookupContainer: undefined,
    lookupQuery: undefined,
    lookupSchema: undefined,
    name: undefined,
    primaryKey: undefined,
    propertyId: undefined,
    propertyURI: undefined,
    rangeURI: undefined,
    required: false,
    scale: undefined,
    URL: undefined,
    shownInInsertView: true,
    shownInUpdateView: true,

    dataType: undefined,
    lookupQueryValue: undefined,
    lookupType: undefined,
    original: undefined,
    updatedField: false,
    isPrimaryKey: false,
    lockType: DOMAIN_FIELD_NOT_LOCKED

}) implements IDomainField {
    conceptURI?: string;
    defaultScale?: string;
    description?: string;
    excludeFromShifting?: boolean;
    format?: string;
    hidden?: boolean;
    importAliases?: string;
    label?: string;
    lookupContainer?: string;
    lookupQuery?: string;
    lookupSchema?: string;
    name: string;
    primaryKey?: boolean;
    propertyId?: number;
    propertyURI: string;
    rangeURI: string;
    required?: boolean;
    scale?: number;
    URL?: string;
    shownInInsertView?: boolean;
    shownInUpdateView?: boolean;

    dataType: PropDescType;
    lookupQueryValue: string;
    lookupType: PropDescType;
    original: Partial<IDomainField>;
    updatedField: boolean;
    isPrimaryKey: boolean;
    lockType: string;

    static create(rawField: Partial<IDomainField>): DomainField {
        let dataType = resolveDataType(rawField);
        let lookupType = LOOKUP_TYPE.set('rangeURI', rawField.rangeURI) as PropDescType;

        return new DomainField(Object.assign({}, rawField, {
            dataType,
            lookupContainer: rawField.lookupContainer === null ? undefined : rawField.lookupContainer,
            lookupQueryValue: encodeLookup(rawField.lookupQuery, lookupType),
            lookupSchema: rawField.lookupSchema === null ? undefined : rawField.lookupSchema,
            lookupType,
            original: {
                dataType,
                rangeURI: rawField.rangeURI
            }
        }));
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

        if (!df.dataType.isLookup()) {
            json.lookupContainer = null;
            json.lookupQuery = null;
            json.lookupSchema = null;
        }

        if (json.lookupContainer === undefined) {
            json.lookupContainer = null;
        }

        // remove non-serializable fields
        delete json.dataType;
        delete json.lookupQueryValue;
        delete json.lookupType;
        delete json.original;
        delete json.updatedField;

        return json;
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getErrors(): FieldErrors {
        if (this.dataType.isLookup() && (!this.lookupSchema || !this.lookupQuery)) {
            return FieldErrors.MISSING_SCHEMA_QUERY;
        }

        return FieldErrors.NONE;
    }

    hasErrors(): boolean {
        return this.getErrors() !== FieldErrors.NONE;
    }

    isNew(): boolean {
        return isFieldNew(this);
    }
}

export function decodeLookup(value: string): {queryName: string, rangeURI: string} {
    const [rangeURI, queryName] = value ? value.split('|') : [undefined, undefined];

    return {
        queryName,
        rangeURI
    };
}

export function encodeLookup(queryName: string, type: PropDescType): string {
    if (queryName) {
        return [type.rangeURI,queryName].join('|');
    }

    return undefined;
}

function isFieldNew(field: Partial<IDomainField>): boolean {
    return field.propertyId === undefined;
}

export function resolveAvailableTypes(field: DomainField): List<PropDescType> {
    // field has not been saved -- display all propTypes
    if (field.isNew()) {
        return PROP_DESC_TYPES;
    }

    // field has been saved -- display eligible propTypes
    // compare against original types as the field's values are volatile
    const { rangeURI } = field.original;

    // field has been saved -- display eligible propTypes
    return PROP_DESC_TYPES.filter((type) => {
        if (type.isLookup()) {
            return rangeURI === INT_RANGE_URI || rangeURI === STRING_RANGE_URI;
        }

        // Catches Users
        if (type.isInteger() && PropDescType.isInteger(rangeURI)) {
            return true;
        }

        // Catches Multiline text
        if (type.isString() && PropDescType.isString(rangeURI)) {
            return true;
        }

        return rangeURI === type.rangeURI;
    }).toList();
}

function resolveDataType(rawField: Partial<IDomainField>): PropDescType {
    let type: PropDescType;

    if (!isFieldNew(rawField)) {
        type = PROP_DESC_TYPES.find((type) => {

            // handle matching rangeURI and conceptURI
            if (type.rangeURI === rawField.rangeURI) {
                if (!rawField.lookupQuery &&
                    ((!type.conceptURI && !rawField.conceptURI) || (type.conceptURI === rawField.conceptURI)))
                {
                    return true;
                }
            }
            // handle selected lookup option
            else if (type.isLookup() && rawField.lookupQuery && rawField.lookupQuery !== 'users') {
                return true;
            }
            // handle selected users option
            else if (type.name === 'users' && rawField.lookupQuery && rawField.lookupQuery === 'users') {
                return true;
            }

            return false;
        });
    }

    return type ? type : TEXT_TYPE;
}

interface IColumnInfoLite {
    friendlyType?: string
    isKeyField?: boolean
    jsonType?: string
    name?: string
}

export class ColumnInfoLite extends Record({
    friendlyType: undefined,
    isKeyField: false,
    jsonType: undefined,
    name: undefined
}) implements IColumnInfoLite {
    friendlyType?: string;
    isKeyField?: boolean;
    jsonType?: string;
    name?: string;

    static create(raw: IColumnInfoLite): ColumnInfoLite {
        return new ColumnInfoLite(raw);
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IQueryInfoLite {
    canEdit?: boolean
    canEditSharedViews?: boolean
    columns?: List<ColumnInfoLite>
    description?: string
    hidden?: boolean
    inherit?: boolean
    isInherited?: boolean
    isMetadataOverrideable?: boolean
    isUserDefined?: boolean
    name?: string
    schemaName?: string
    snapshot?: false
    title?: string
    viewDataUrl?: string
}

export class QueryInfoLite extends Record({
    canEdit: false,
    canEditSharedViews: false,
    columns: List(),
    description: undefined,
    hidden: false,
    inherit: false,
    isInherited: false,
    isMetadataOverrideable: false,
    isUserDefined: false,
    name: undefined,
    schemaName: undefined,
    snapshot: false,
    title: undefined,
    viewDataUrl: undefined
}) implements IQueryInfoLite {
    canEdit?: boolean;
    canEditSharedViews?: boolean;
    columns?: List<ColumnInfoLite>;
    description?: string;
    hidden?: boolean;
    inherit?: boolean;
    isInherited?: boolean;
    isMetadataOverrideable?: boolean;
    isUserDefined?: boolean;
    name?: string;
    schemaName?: string;
    snapshot?: false;
    title?: string;
    viewDataUrl?: string;

    static create(raw: IQueryInfoLite, schemaName: string): QueryInfoLite {
        return new QueryInfoLite(Object.assign({}, raw, {
            columns: raw.columns ? List((raw.columns as any).map(c => ColumnInfoLite.create(c))) : List(),
            schemaName
        }));
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getLookupInfo(rangeURI?: string): List<{name: string, type: PropDescType}> {
        let infos = List<{name: string, type: PropDescType}>().asMutable();
        let pkCols = this.getPkColumns()
            .filter(col => col.name.toLowerCase() !== 'container')
            .toList();

        if (pkCols.size === 1) {

            // Sample Set hack (ported from DomainEditorServiceBase.java)
            if (this.schemaName.toLowerCase() === 'samples') {
                let nameCol = this.columns.find(c => c.name.toLowerCase() === 'name');

                if (nameCol) {
                    pkCols = pkCols.push(nameCol);
                }
            }

            pkCols.forEach((pk) => {
                let type = PROP_DESC_TYPES.find(propType => propType.name.toLowerCase() === pk.jsonType.toLowerCase());

                // if supplied, apply rangeURI matching filter
                if (type && (rangeURI === undefined || rangeURI === type.rangeURI)) {
                    infos.push({
                        name: this.name,
                        type
                    });
                }
            });
        }

        return infos.asImmutable();
    }

    getPkColumns(): List<ColumnInfoLite> {
        return this.columns.filter(c => c.isKeyField).toList();
    }
}

interface IDomainException {
    exception: string;
    success: boolean;
    severity: string;
    errors?: List<DomainFieldError>;
}

export class DomainException extends Record({
    exception: undefined,
    success: undefined,
    severity: undefined,
    errors: List<DomainFieldError>()

}) implements IDomainException{
    exception: string;
    success: boolean;
    severity: string;
    errors?: List<DomainFieldError>;

    static create(rawModel: any, severityLevel): DomainException
    {
        if (rawModel)
        {
            let exception = rawModel.exception;
            let success = rawModel.success;
            let severity = severityLevel;
            let errors = List<DomainFieldError>();

            if (rawModel.errors)
            {
                errors = DomainFieldError.fromJS(rawModel.errors, severityLevel);
            }

            return new DomainException({
                exception,
                success,
                severity,
                errors
            })
        }
        return undefined;
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    index?: number
}

export class DomainFieldError extends Record({
    message: undefined,
    fieldName: undefined,
    propertyId: undefined,
    severity: undefined,
    index: undefined

}) implements IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    index?: number;

    static fromJS(rawFields: Array<any>, severityLevel: String): List<DomainFieldError> {

        let fieldErrors = List<DomainFieldError>().asMutable();

        for (let i=0; i < rawFields.length; i++) {

            let message = rawFields[i].message;
            let fieldName = rawFields[i].field;
            let propertyId = (rawFields[i].id === "null" ? undefined : rawFields[i].id);
            let severity = severityLevel;
            let index = getIndexFromId(createFormInputName(fieldName));

            let domainFieldError = new DomainFieldError({message, fieldName, propertyId, severity, index});
            fieldErrors.push(domainFieldError);
        }

        return fieldErrors.asImmutable();
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}