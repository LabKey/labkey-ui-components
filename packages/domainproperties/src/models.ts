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
import { Utils } from "@labkey/api";
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_MEASURE,
    FLAG_CONCEPT_URI,
    DATETIME_RANGE_URI,
    DOMAIN_FIELD_NOT_LOCKED,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI,
    USER_RANGE_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    DOMAIN_FIELD_PARTIALLY_LOCKED
} from "./constants";
import {SCHEMAS} from "@glass/base";

export interface IFieldChange {
    id: string,
    value: any
}

export interface IBannerMessage {
    message: string,
    messageType: string,
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
    alternateRangeURI: undefined,
    shortDisplay: undefined
}) implements IPropDescType {
    conceptURI: string;
    display: string;
    name: string;
    rangeURI: string;
    alternateRangeURI: string;
    shortDisplay: string;

    static isSample(conceptURI: string): boolean {
        return conceptURI === SAMPLE_TYPE_CONCEPT_URI;
    }

    static isLookup(name: string): boolean {
        return name === 'lookup';
    }

    static isInteger(rangeURI: string): boolean {
        return (rangeURI === INT_RANGE_URI || rangeURI === USER_RANGE_URI);
    }

    static isString(rangeURI: string): boolean {
        return (rangeURI === STRING_RANGE_URI || rangeURI === MULTILINE_RANGE_URI);
    }

    static isMeasureDimension(rangeURI: string): boolean {
        return (rangeURI !== ATTACHMENT_RANGE_URI && rangeURI !== FILELINK_RANGE_URI);
    }

    static isMvEnableable(rangeURI: string): boolean {
        return (rangeURI !== ATTACHMENT_RANGE_URI && rangeURI !== FILELINK_RANGE_URI && rangeURI !== MULTILINE_RANGE_URI)
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    //TODO: shouldn't this check the alternateRangeURI too?
    isLookup(): boolean {
        return PropDescType.isLookup(this.name);
    }

    //TODO: shouldn't this check the alternateRangeURI too?
    isInteger(): boolean {
        return PropDescType.isInteger(this.rangeURI);
    }

    //TODO: shouldn't this check the alternateRangeURI too?
    isString(): boolean {
        return PropDescType.isString(this.rangeURI);
    }

    isSample(): boolean {
        return PropDescType.isSample(this.conceptURI)
    }
}

export const TEXT_TYPE = new PropDescType({name: 'string', display: 'Text (String)', rangeURI: STRING_RANGE_URI, alternateRangeURI: 'xsd:string', shortDisplay: 'String'});
export const LOOKUP_TYPE = new PropDescType({name: 'lookup', display: 'Lookup'});
export const MULTILINE_TYPE = new PropDescType({name: 'multiLine', display: 'Multi-Line Text', rangeURI: MULTILINE_RANGE_URI});
export const BOOLEAN_TYPE = new PropDescType({name: 'boolean', display: 'Boolean', rangeURI: BOOLEAN_RANGE_URI, alternateRangeURI: 'xsd:boolean'});
export const INTEGER_TYPE = new PropDescType({name: 'int', display: 'Integer', rangeURI: INT_RANGE_URI, alternateRangeURI: 'xsd:int'});
export const DOUBLE_TYPE = new PropDescType({name: 'double', display: 'Decimal', rangeURI: DOUBLE_RANGE_URI, alternateRangeURI: 'xsd:double'});
export const DATETIME_TYPE = new PropDescType({name: 'dateTime', display: 'Date Time', rangeURI: DATETIME_RANGE_URI, alternateRangeURI: 'xsd:dateTime'});
export const FLAG_TYPE = new PropDescType({name: 'flag', display: 'Flag (String)', rangeURI: STRING_RANGE_URI, conceptURI: FLAG_CONCEPT_URI});
export const FILE_TYPE = new PropDescType({name: 'fileLink', display: 'File', rangeURI: FILELINK_RANGE_URI});
export const ATTACHMENT_TYPE = new PropDescType({name: 'attachment', display: 'Attachment', rangeURI: ATTACHMENT_RANGE_URI});
export const USERS_TYPE = new PropDescType({name: 'users', display: 'User', rangeURI: USER_RANGE_URI});
export const PARTICIPANT_TYPE = new PropDescType({name: 'ParticipantId', display: 'Subject/Participant (String)', rangeURI: STRING_RANGE_URI, conceptURI: PARTICIPANTID_CONCEPT_URI});
export const SAMPLE_TYPE = new PropDescType({name: 'sample', display: 'Sample', rangeURI: STRING_RANGE_URI, conceptURI: SAMPLE_TYPE_CONCEPT_URI});

export const PROP_DESC_TYPES = List([
    TEXT_TYPE,
    MULTILINE_TYPE,
    BOOLEAN_TYPE,
    INTEGER_TYPE,
    DOUBLE_TYPE,
    DATETIME_TYPE,
    FLAG_TYPE,
    FILE_TYPE,
    ATTACHMENT_TYPE,
    USERS_TYPE,
    PARTICIPANT_TYPE,
    LOOKUP_TYPE,
    SAMPLE_TYPE,
]);

interface IDomainDesign {
    name: string
    container: string
    description?: string
    domainURI: string
    domainId: number
    allowFileLinkProperties: boolean
    allowAttachmentProperties: boolean
    allowFlagProperties: boolean
    fields?: List<DomainField>
    indices?: List<DomainIndex>
    domainException?: DomainException
}

export class DomainDesign extends Record({
    name: undefined,
    container: undefined,
    description: undefined,
    domainURI: undefined,
    domainId: null,
    allowFileLinkProperties: true,
    allowAttachmentProperties: true,
    allowFlagProperties: true,
    fields: List<DomainField>(),
    indices: List<DomainIndex>(),
    domainException: undefined,
    mandatoryFieldNames: List<string>(),
    reservedFieldNames: List<string>()
}) implements IDomainDesign {
    name: string;
    container: string;
    description: string;
    domainURI: string;
    domainId: number;
    allowFileLinkProperties: boolean;
    allowAttachmentProperties: boolean;
    allowFlagProperties: boolean;
    fields: List<DomainField>;
    indices: List<DomainIndex>;
    domainException: DomainException;
    mandatoryFieldNames: List<string>;
    reservedFieldNames: List<string>;

    static create(rawModel: any, exception?: any): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();
        let mandatoryFieldNames = List<string>();
        let domainException = DomainException.create(exception, (exception ? exception.severity : undefined));

        if (rawModel) {
            if (rawModel.mandatoryFieldNames) {
                mandatoryFieldNames = List<string>(rawModel.mandatoryFieldNames.map((name) => name.toLowerCase()));
            }

            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields, mandatoryFieldNames);
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

        // remove non-serializable fields
        delete json.domainException;

        return json;
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    hasErrors(): boolean {
        return this.fields.find((f) => f.hasErrors()) !== undefined;
    }

    hasException(): boolean {
        return (this.domainException !== undefined && this.domainException.errors !== undefined);
    }

    isNameSuffixMatch(name: string): boolean {
        return this.name && this.name.endsWith(name + ' Fields');
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

interface ILookupConfig {
    lookupContainer?: string
    lookupQuery?: string
    lookupSchema?: string
    lookupQueryValue?: string;
    lookupType?: PropDescType
}

// Commented out properties are unused
export interface IDomainField {
    conceptURI?: string
    defaultScale?: string
    description?: string
    dimension?: boolean
    excludeFromShifting?: boolean
    format?: string
    hidden?: boolean
    importAliases?: string
    label?: string
    lookupContainer?: string
    lookupQuery?: string
    lookupSchema?: string
    measure?: boolean
    mvEnabled?: boolean
    name: string
    PHI?: string
    primaryKey?: boolean
    propertyId?: number
    propertyURI: string
    rangeURI: string
    required?: boolean
    recommendedVariable?: boolean
    scale?: number
    URL?: string
    shownInDetailsView?: boolean
    shownInInsertView?: boolean
    shownInUpdateView?: boolean
    visible: boolean
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
    dimension: undefined,
    excludeFromShifting: false,
    format: undefined,
    hidden: false,
    importAliases: undefined,
    label: undefined,
    lookupContainer: undefined,
    lookupQuery: undefined,
    lookupSchema: undefined,
    measure: undefined,
    mvEnabled: false,
    name: undefined,
    PHI: undefined,
    primaryKey: undefined,
    propertyId: undefined,
    propertyURI: undefined,
    rangeURI: undefined,
    recommendedVariable: false,
    required: false,
    scale: undefined,
    URL: undefined,
    shownInDetailsView: true,
    shownInInsertView: true,
    shownInUpdateView: true,
    visible: true,
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
    dimension?: boolean;
    excludeFromShifting?: boolean;
    format?: string;
    hidden?: boolean;
    importAliases?: string;
    label?: string;
    lookupContainer?: string;
    lookupQuery?: string;
    lookupSchema?: string;
    measure?: boolean;
    mvEnabled?: boolean;
    name: string;
    PHI?: string;
    primaryKey?: boolean;
    propertyId?: number;
    propertyURI: string;
    rangeURI: string;
    recommendedVariable: boolean;
    required?: boolean;
    scale?: number;
    URL?: string;
    shownInDetailsView?: boolean;
    shownInInsertView?: boolean;
    shownInUpdateView?: boolean;
    visible: boolean;
    dataType: PropDescType;
    lookupQueryValue: string;
    lookupType: PropDescType;
    original: Partial<IDomainField>;
    updatedField: boolean;
    isPrimaryKey: boolean;
    lockType: string;

    static create(rawField: Partial<IDomainField>, shouldApplyDefaultValues?: boolean, mandatoryFieldNames?: List<string>): DomainField {
        let baseField = DomainField.resolveBaseProperties(rawField, mandatoryFieldNames);
        const {dataType} = baseField;
        const lookup = DomainField.resolveLookupConfig(rawField, dataType);
        let field = new DomainField(Object.assign(baseField, rawField, {
            ...lookup,
            original: {
                dataType,
                conceptURI: rawField.conceptURI,
                rangeURI: rawField.propertyId !== undefined ? rawField.rangeURI : undefined // Issue 38366: only need to use rangeURI filtering for already saved field/property
            }
        }));

        if (shouldApplyDefaultValues) {
            field = DomainField.updateDefaultValues(field);
        }

        return field;
    }

    private static resolveLookupConfig(rawField: Partial<IDomainField>, dataType: PropDescType): ILookupConfig {
        let lookupType = LOOKUP_TYPE.set('rangeURI', rawField.rangeURI) as PropDescType;
        let lookupContainer = rawField.lookupContainer === null ? undefined : rawField.lookupContainer;
        let lookupSchema = rawField.lookupSchema === null ? undefined : resolveLookupSchema(rawField, dataType);
        let lookupQuery = rawField.lookupQuery || (dataType === SAMPLE_TYPE ? SCHEMAS.EXP_TABLES.MATERIALS.queryName : undefined);
        let lookupQueryValue = encodeLookup(lookupQuery, lookupType);

        return {
            lookupContainer,
            lookupSchema,
            lookupQuery,
            lookupType,
            lookupQueryValue,
        };
    }

    static fromJS(rawFields: Array<IDomainField>, mandatoryFieldNames?: List<string>): List<DomainField> {
        let fields = List<DomainField>();

        for (let i=0; i < rawFields.length; i++) {
            fields = fields.push(DomainField.create(rawFields[i], undefined, mandatoryFieldNames));
        }

        return fields;
    }

    static resolveBaseProperties(raw: Partial<IDomainField>, mandatoryFieldNames?: List<string>): Partial<IDomainField> {
        let dataType = resolveDataType(raw);

        // lockType can either come from the rawField, or be based on the domain's mandatoryFieldNames
        const isMandatoryFieldMatch = mandatoryFieldNames !== undefined && mandatoryFieldNames.contains(raw.name.toLowerCase());
        let lockType = raw.lockType || DOMAIN_FIELD_NOT_LOCKED;
        if (lockType === DOMAIN_FIELD_NOT_LOCKED && isMandatoryFieldMatch) {
            lockType = DOMAIN_FIELD_PARTIALLY_LOCKED;
        }

        let field = {dataType, lockType} as IDomainField;

        //Infer SampleId as SAMPLE_TYPE for sample manager and mark required
        if (isFieldNew(raw) && raw.name) {
            if (raw.name.localeCompare('SampleId', 'en', {sensitivity: 'accent'}) === 0) {
                field.dataType = SAMPLE_TYPE;
                field.conceptURI = SAMPLE_TYPE.conceptURI;
                field.required = true;
            }
        }

        return field;
    }

    static serialize(df: DomainField): any {
        let json = df.toJS();

        if (!(df.dataType.isLookup() || df.dataType.isSample()) ) {
            json.lookupContainer = null;
            json.lookupQuery = null;
            json.lookupSchema = null;
        }

        if (json.lookupContainer === undefined) {
            json.lookupContainer = null;
        }

        // for some reason the property binding server side cares about casing here for 'URL' and 'PHI'
        if (json.URL !== undefined) {
            json.url = json.URL;
            delete json.URL;
        }
        if (json.PHI !== undefined) {
            json.phi = json.PHI;
            delete json.PHI;
        }

        // remove non-serializable fields
        delete json.dataType;
        delete json.lookupQueryValue;
        delete json.lookupType;
        delete json.original;
        delete json.updatedField;
        delete json.visible;

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

    static updateDefaultValues(field: DomainField): DomainField {

        return field.merge({
            measure: DomainField.defaultValues(DOMAIN_FIELD_MEASURE, field.dataType),
            dimension: DomainField.defaultValues(DOMAIN_FIELD_DIMENSION, field.dataType)
        }) as DomainField;
    }

    static defaultValues(prop: string, type: PropDescType): any {

        switch(prop) {
            case DOMAIN_FIELD_MEASURE:
                return (type === INTEGER_TYPE || type === DOUBLE_TYPE);
            case DOMAIN_FIELD_DIMENSION:
                return (type === LOOKUP_TYPE || type === USERS_TYPE || type === SAMPLE_TYPE);
            default:
                return false
        }
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

function resolveLookupSchema(rawField: Partial<IDomainField>, dataType: PropDescType): string {
    if (rawField.lookupSchema)
        return rawField.lookupSchema;

    if (dataType === SAMPLE_TYPE )
        return SCHEMAS.EXP_TABLES.SCHEMA;

    return undefined;
}

export function updateSampleField(field: Partial<DomainField>, sampleQueryValue?: string): DomainField {

    let { queryName, rangeURI = STRING_RANGE_URI } = decodeLookup(sampleQueryValue);
    let lookupType = field.lookupType || LOOKUP_TYPE;
    let sampleField = 'all' === sampleQueryValue ?
        {
            lookupSchema: SCHEMAS.EXP_TABLES.SCHEMA,
            lookupQuery: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
            lookupQueryValue: sampleQueryValue,
            lookupType: field.lookupType.set('rangeURI', rangeURI),
            rangeURI: STRING_RANGE_URI,
        }:
        {
            lookupSchema: SCHEMAS.SAMPLE_SETS.SCHEMA,
            lookupQuery: queryName,
            lookupQueryValue: sampleQueryValue || 'all',
            lookupType: lookupType.set('rangeURI', rangeURI),
            rangeURI: rangeURI,
        };

    return field.merge(sampleField) as DomainField;
}

function isFieldNew(field: Partial<IDomainField>): boolean {
    return field.propertyId === undefined;
}

export function resolveAvailableTypes(field: DomainField, availableTypes: List<PropDescType>): List<PropDescType> {
    // field has not been saved -- display all propTypes
    if (field.isNew()) {
        return availableTypes;
    }

    // field has been saved -- display eligible propTypes
    // compare against original types as the field's values are volatile
    const { rangeURI } = field.original;

    // field has been saved -- display eligible propTypes
    return availableTypes.filter((type) => {
        if (type.isLookup() || type.isSample()) {
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

    if (!isFieldNew(rawField) || rawField.rangeURI !== undefined) {
        if (rawField.conceptURI === SAMPLE_TYPE_CONCEPT_URI)
            return SAMPLE_TYPE;

        type = PROP_DESC_TYPES.find((type) => {

            // handle matching rangeURI and conceptURI
            if (type.rangeURI === rawField.rangeURI) {
                if (!rawField.lookupQuery &&
                    ((!type.conceptURI && !rawField.conceptURI) || (type.conceptURI === rawField.conceptURI)))
                {
                    return true;
                }
            }
            // handle alternateRangeURI which are returned from the server for inferDomain response
            else if (type.alternateRangeURI && type.alternateRangeURI === rawField.rangeURI) {
                return true;
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

//modeled after the JSON object received during server side error (except the severity).
interface IDomainException {
    exception: string;
    success: boolean;
    severity: string;
    errors?: List<DomainFieldError>;
}

// DomainException is used for both server side and client side errors.
// For server side, DomainException object is constructed in actions.ts (see saveDomain()) on failure while saving or creating a domain.
// For client side, DomainException object is constructed in actions.ts (see handleDomainUpdates()) while updating the domain.
export class DomainException extends Record({
    exception: undefined,
    success: undefined,
    severity: undefined,
    errors: List<DomainFieldError>()

}) implements IDomainException
{
    exception: string;
    success: boolean;
    severity: string;
    errors?: List<DomainFieldError>;

    static create(rawModel: any, severityLevel): DomainException {
        if (rawModel)
        {
            let errors = List<DomainFieldError>();
            if (rawModel.errors) {
                errors = DomainFieldError.fromJS(rawModel.errors, severityLevel);
            }

            return new DomainException({
                exception: rawModel.exception,
                success: rawModel.success,
                severity: severityLevel,
                errors: errors
            })
        }
        return undefined;
    }

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    //merge warnings with an incoming server side errors so that both server and pre-existing client side warning can be shown on the banner
    static mergeWarnings(domain: DomainDesign, exception: DomainException) {
        //merge pre-existing warnings on the domain
        if (domain && domain.hasException()) {

            let existingWarnings = domain.domainException.get('errors').filter(e => e.severity === SEVERITY_LEVEL_WARN);
            let serverSideErrors = exception.get('errors');
            let allErrors = serverSideErrors.concat(existingWarnings);

            return exception.set('errors', allErrors);
        }

        return exception.set('errors', exception.errors);
    }

    static addRowIndexesToErrors(domain: DomainDesign, exceptionFromServer: DomainException) {

        let allFieldErrors = exceptionFromServer.get('errors');

        allFieldErrors = allFieldErrors.map((error) => {

            let indices = domain.fields.reduce((indexList, field, idx, iter) : List<number> => {

                if (((field.name === undefined || field.name === '') && error.get("fieldName") === undefined) ||
                    (field.propertyId !== undefined && error.get("propertyId") === field.propertyId) ||
                    (field.name !== undefined && error.get("fieldName") !== undefined && field.name.toLowerCase() === error.get("fieldName").toLowerCase())) {

                    indexList = indexList.push(idx);
                }

                return indexList;
            }, List<number>());

            return error.merge({rowIndexes: indices});
        });

        return exceptionFromServer.set('errors', allFieldErrors) as DomainException;
    }
}

interface IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    rowIndexes: List<number>;
    newRowIndexes?: List<number> //for drag and drop
}

export class DomainFieldError extends Record({
    message: undefined,
    fieldName: undefined,
    propertyId: undefined,
    severity: undefined,
    rowIndexes: List<number>(),
    newRowIndexes: undefined

}) implements IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    rowIndexes: List<number>;
    newRowIndexes?: List<number>;

    static fromJS(rawFields: Array<any>, severityLevel: String): List<DomainFieldError> {

        let fieldErrors = List<DomainFieldError>().asMutable();

        for (let i=0; i < rawFields.length; i++) {

            //empty field name and property id comes in as "form" string from the server, resetting it to undefined here
            let fieldName = (rawFields[i].id === "form" && rawFields[i].field === "form" ? undefined : rawFields[i].field);
            let propertyId = (rawFields[i].id === "form" && rawFields[i].field === "form" ? undefined : rawFields[i].id);

            let domainFieldError = new DomainFieldError({message: rawFields[i].message, fieldName, propertyId,
                severity: severityLevel, rowIndexes: (rawFields[i].rowIndexes ? rawFields[i].rowIndexes : List<number>())});
            fieldErrors.push(domainFieldError);
        }

        return fieldErrors.asImmutable();
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export class AssayProtocolModel extends Record({
    allowBackgroundUpload: false,
    allowEditableResults: false,
    allowQCStates: false,
    allowSpacesInPath: false,
    allowTransformationScript: false,
    autoCopyTargetContainer: undefined,
    autoCopyTargetContainerId: undefined,
    availableDetectionMethods: undefined,
    availableMetadataInputFormats: undefined,
    availablePlateTemplates: undefined,
    backgroundUpload: false,
    description: undefined,
    domains: undefined,
    editableResults: false,
    editableRuns: false,
    metadataInputFormatHelp: undefined,
    moduleTransformScripts: undefined,
    name: undefined,
    protocolId: undefined,
    protocolParameters: undefined,
    protocolTransformScripts: undefined,
    providerName: undefined,
    saveScriptFiles: false,
    selectedDetectionMethod: undefined,
    selectedMetadataInputFormat: undefined,
    selectedPlateTemplate: undefined,
    qcEnabled: undefined
}) {
    allowBackgroundUpload: boolean;
    allowEditableResults: boolean;
    allowQCStates: boolean;
    allowSpacesInPath: boolean;
    allowTransformationScript: boolean;
    autoCopyTargetContainer: {};
    autoCopyTargetContainerId: string;
    availableDetectionMethods: [];
    availableMetadataInputFormats: {};
    availablePlateTemplates: [];
    backgroundUpload: boolean;
    description: string;
    domains: List<DomainDesign>;
    editableResults: boolean;
    editableRuns: boolean;
    metadataInputFormatHelp: any;
    moduleTransformScripts: List<string>;
    name: string;
    protocolId: number;
    protocolParameters: any;
    protocolTransformScripts: List<string>;
    providerName: string;
    saveScriptFiles: boolean;
    selectedDetectionMethod: string;
    selectedMetadataInputFormat: string;
    selectedPlateTemplate: string;
    qcEnabled: boolean;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any): AssayProtocolModel {
        let domains = raw.domains || List<DomainDesign>();
        if (raw.domains && Utils.isArray(raw.domains)) {
            domains = List<DomainDesign>(
                raw.domains.map((domain) => {
                    return DomainDesign.create(domain);
                })
            );
        }

        if (raw.protocolTransformScripts && Utils.isArray(raw.protocolTransformScripts)) {
            raw.protocolTransformScripts = List<string>(raw.protocolTransformScripts);
        }
        if (raw.moduleTransformScripts && Utils.isArray(raw.moduleTransformScripts)) {
            raw.moduleTransformScripts = List<string>(raw.moduleTransformScripts);
        }

        // if this is not an existing assay, clear the name property so the user must set it
        const name = !raw.protocolId ? undefined : raw.name;

        return new AssayProtocolModel({
            ...raw,
            name,
            domains
        });
    }

    static serialize(model: AssayProtocolModel): any {
        // need to serialize the DomainDesign objects to remove the unrecognized fields
        const domains = model.domains.map((domain) => {
            return DomainDesign.serialize(domain);
        });

        let json = model.merge({domains}).toJS();

        // only need to serialize the id and not the autoCopyTargetContainer object
        delete json.autoCopyTargetContainer;

        return json;
    }

    getDomainByNameSuffix(name: string): DomainDesign {
        if (this.domains.size > 0) {
            return this.domains.find((domain) => {
                return domain.isNameSuffixMatch(name);
            });
        }
    }

    get container() {
        return this.getIn(['domains', 0, 'container']);
    }

    isNew(): boolean {
        return !this.protocolId;
    }

    allowPlateTemplateSelection(): boolean {
        return this.availablePlateTemplates && Utils.isArray(this.availablePlateTemplates);
    }

    allowDetectionMethodSelection(): boolean {
        return this.availableDetectionMethods && Utils.isArray(this.availableDetectionMethods);
    }

    allowMetadataInputFormatSelection(): boolean {
        return this.availableMetadataInputFormats && Utils.isObject(this.availableMetadataInputFormats) && !Utils.isEmptyObj(this.availableMetadataInputFormats);
    }

    validateTransformScripts(): string {
        if (this.protocolTransformScripts === undefined || this.protocolTransformScripts.size === 0) {
            return undefined;
        }

        // make sure we don't have any script inputs that are empty strings
        const hasEmptyScript = this.protocolTransformScripts.some((script, i) => script === undefined || script === null || script.length === 0);
        if (hasEmptyScript) {
            return 'Missing required transform script path.';
        }

        // if not allowSpacesInPath, the path to the script should not contain spaces when the Save Script Data check box is selected
        if (!this.allowSpacesInPath && this.saveScriptFiles) {
            const hasSpacedScript = this.protocolTransformScripts.some((script, i) => script.indexOf(' ') > -1);
            if (hasSpacedScript) {
                return 'The path to the transform script should not contain spaces when the \'Save Script Data for Debugging\' check box is selected.'
            }
        }
    }

    isValid(): boolean {
        return (this.name !== undefined && this.name !==null && this.name.trim().length > 0)
            && (!this.allowMetadataInputFormatSelection() || Utils.isString(this.selectedMetadataInputFormat))
            && (!this.allowDetectionMethodSelection() || Utils.isString(this.selectedDetectionMethod))
            && (!this.allowPlateTemplateSelection() || Utils.isString(this.selectedPlateTemplate))
            && this.validateTransformScripts() === undefined;
    }
}

export type HeaderRenderer = (config:IAppDomainHeader) => any

export interface IAppDomainHeader {
    domain: DomainDesign
    modelDomains?: List<DomainDesign>
    onChange?: (changes: List<IFieldChange>, index: number, expand: boolean) => void
    onAddField?: (fieldConfig: Partial<IDomainField>) => void
    onDomainChange?: (index: number, updatedDomain: DomainDesign) => void
}
