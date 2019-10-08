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
    USER_RANGE_URI, DOMAIN_URI_PREFIX
} from "./constants";

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

    getJsonType(): string {
        switch(this.name) {
            case 'boolean':
                return 'boolean';
            case 'int':
                return 'int';
            case 'double':
                return 'float';
            case 'dateTime':
                return 'date';
            default:
                return 'string';

        }
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

    isFileType(): boolean {
        return (this === FILE_TYPE || this === ATTACHMENT_TYPE )
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
    LOOKUP_TYPE
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
    defaultDefaultValueType: string
    defaultValueOptions: List<string>
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
    defaultDefaultValueType: undefined,
    defaultValueOptions: List<string>(),
    fields: List<DomainField>(),
    indices: List<DomainIndex>(),
    domainException: undefined
}) implements IDomainDesign {
    name: string;
    container: string;
    description: string;
    domainURI: string;
    domainId: number;
    allowFileLinkProperties: boolean;
    allowAttachmentProperties: boolean;
    allowFlagProperties: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    fields: List<DomainField>;
    indices: List<DomainIndex>;
    domainException: DomainException;

    static init(name: string): DomainDesign {
        // TODO: can these domainURI template values be filled in by the saveProtocol API and not provided here?
        return DomainDesign.create({
            name: name + ' Fields',
            domainURI: 'urn:lsid:${LSIDAuthority}:AssayDomain-' + name + '.Folder-${Container.RowId}:${AssayName}'
        });
    }

    static create(rawModel: any, exception?: any): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();
        let defaultValueOptions = List<DomainField>().asMutable();
        let domainException = DomainException.create(exception, (exception ? exception.severity : undefined));

        if (rawModel) {
            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields);
            }

            if (rawModel.indices) {
                indices = DomainIndex.fromJS(rawModel.indices);
            }

            if (rawModel.defaultValueOptions)
            {

                for (let i = 0; i < rawModel.defaultValueOptions.length; i++)
                {
                    defaultValueOptions.push(rawModel.defaultValueOptions[i]);
                }
            }

            defaultValueOptions = defaultValueOptions.asImmutable();
        }

        return new DomainDesign({
            ...rawModel,
            fields,
            indices,
            defaultValueOptions,
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

    getDomainKind = () => {
        const kind = this.domainURI.substring(DOMAIN_URI_PREFIX.length);

        return kind.split('.')[0];
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

export interface IConditionalFormat {
    formatFilter: string,
    bold: boolean,
    italic: boolean,
    strikethrough: boolean,
    textColor?: string,
    backgroundColor?: string
}

export class ConditionalFormat extends Record({
    formatFilter: undefined,
    bold: false,
    italic: false,
    strikethrough: false,
    textColor: undefined,
    backgroundColor: undefined
}) implements IConditionalFormat {
    formatFilter: string;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    textColor?: string;
    backgroundColor?: string;

    constructor(values?: { [key: string]: any }) {

        // filter is a reserved work on Records so change to formatFilter
        if (values && !values.get('formatFilter')) {
            values = values.set('formatFilter', values.get('filter'));
        }
        super(values);
    }

    static fromJS(rawCondFormat: Array<ConditionalFormat>): List<ConditionalFormat> {
        let condFormats = List<ConditionalFormat>().asMutable();

        for (let i=0; i < rawCondFormat.length; i++) {
            condFormats.push(new ConditionalFormat(fromJS(rawCondFormat[i])));
        }

        return condFormats.asImmutable();
    }

    static serialize(cfs: Array<any>): any {

        // Change formatFilter back to filter as that is what API is expecting
        for (let i=0; i < cfs.length; i++) {
            cfs[i].filter = cfs[i].formatFilter;
            delete cfs[i].formatFilter;
        }

        return cfs;
    }
}

export interface IPropertyValidatorProperties {
    failOnMatch: boolean
}

export class PropertyValidatorProperties extends Record({
    failOnMatch: false
}) implements IPropertyValidatorProperties {
    failOnMatch: boolean;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export interface IPropertyValidator {
    type: string,
    name: string,
    properties: List<PropertyValidatorProperties>,
    errorMessage?: string,
    description?: string,
    new: boolean,
    rowId?: number,
    expression?: string
}

export class PropertyValidator extends Record({
    type: undefined,
    name: undefined,
    properties: List<PropertyValidatorProperties>(),
    errorMessage: undefined,
    description: undefined,
    new : true,
    rowId: undefined,
    expression: undefined
}) implements IPropertyValidator {
    type: string;
    name: string;
    properties: List<PropertyValidatorProperties>;
    errorMessage?: string;
    description?: string;
    new: boolean;
    rowId?: number;
    expression?: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static fromJS(rawPropertyValidator: Array<IPropertyValidator>, range: boolean): List<PropertyValidator> {
        let propValidators = List<PropertyValidator>().asMutable();

        let newPv;
        for (let i=0; i < rawPropertyValidator.length; i++) {
            if ( range && rawPropertyValidator[i].type === "Range" ||
                !range && rawPropertyValidator[i].type === "RegEx")
            {
                newPv = new PropertyValidator(fromJS(rawPropertyValidator[i]));
                newPv = newPv.set("properties", new PropertyValidatorProperties(fromJS(rawPropertyValidator[i]['properties'])));
                propValidators.push(newPv);
            }
        }

        return propValidators.asImmutable();
    }
}

export interface IDomainField {
    conceptURI?: string
    conditionalFormats: List<ConditionalFormat>
    defaultScale?: string
    defaultValueType?: string
    defaultValue?: string
    defaultDisplayValue?: string
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
    propertyValidators: List<PropertyValidator>
    rangeValidators: List<PropertyValidator>
    rangeURI: string
    regexValidators: List<PropertyValidator>
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
    conditionalFormats: List<ConditionalFormat>(),
    defaultScale: undefined,
    defaultValueType: undefined,
    defaultValue: undefined,
    defaultDisplayValue: undefined,
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
    propertyValidators: List<PropertyValidator>(),
    rangeValidators: List<PropertyValidator>(),
    rangeURI: undefined,
    regexValidators: List<PropertyValidator>(),
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
    conditionalFormats: List<ConditionalFormat>;
    defaultScale?: string;
    defaultValueType?: string;
    defaultValue?: string;
    defaultDisplayValue?: string;
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
    propertyValidators: List<PropertyValidator>;
    rangeValidators: List<PropertyValidator>;
    rangeURI: string;
    regexValidators: List<PropertyValidator>;
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

    static create(rawField: any, shouldApplyDefaultValues?: boolean): DomainField {
        let dataType = resolveDataType(rawField);
        let lookupType = LOOKUP_TYPE.set('rangeURI', rawField.rangeURI) as PropDescType;

        let field = new DomainField(Object.assign({}, rawField, {
            dataType,
            lookupContainer: rawField.lookupContainer === null ? undefined : rawField.lookupContainer,
            lookupQueryValue: encodeLookup(rawField.lookupQuery, lookupType),
            lookupSchema: rawField.lookupSchema === null ? undefined : rawField.lookupSchema,
            lookupType,
            original: {
                dataType,
                rangeURI: rawField.propertyId !== undefined ? rawField.rangeURI : undefined // Issue 38366: only need to use rangeURI filtering for already saved field/property
            }
        }));

        if (rawField.conditionalFormats) {
            field = field.set("conditionalFormats", ConditionalFormat.fromJS(rawField.conditionalFormats)) as DomainField;
        }

        if (rawField.propertyValidators) {
            field = field.set("rangeValidators", PropertyValidator.fromJS(rawField.propertyValidators, true)) as DomainField;
            field = field.set("regexValidators", PropertyValidator.fromJS(rawField.propertyValidators, false)) as DomainField;
        }

        if (shouldApplyDefaultValues) {
            field = DomainField.updateDefaultValues(field);
        }

        return field;
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

        // for some reason the property binding server side cares about casing here for 'URL' and 'PHI'
        if (json.URL !== undefined) {
            json.url = json.URL;
            delete json.URL;
        }
        if (json.PHI !== undefined) {
            json.phi = json.PHI;
            delete json.PHI;
        }

        if (json.conditionalFormats) {
            json.conditionalFormats = ConditionalFormat.serialize(json.conditionalFormats);
        }

        json.propertyValidators = [];
        if (json.rangeValidators) {
            json.propertyValidators = json.propertyValidators.concat(json.rangeValidators);
        }

        if (json.regexValidators) {
            json.propertyValidators = json.propertyValidators.concat(json.regexValidators);
        }

        // remove non-serializable fields
        delete json.dataType;
        delete json.lookupQueryValue;
        delete json.lookupType;
        delete json.original;
        delete json.updatedField;
        delete json.visible;
        delete json.rangeValidators;
        delete json.regexValidators;

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

    static hasRangeValidation(field: DomainField): boolean {
        return (field.dataType === INTEGER_TYPE ||
                field.dataType === DOUBLE_TYPE ||
                field.dataType === DATETIME_TYPE ||
                field.dataType === USERS_TYPE ||
                field.dataType === LOOKUP_TYPE);
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
                return (type === LOOKUP_TYPE || type === USERS_TYPE);
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

    if (!isFieldNew(rawField) || rawField.rangeURI !== undefined) {
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
    allowTransformationScript: false,
    autoCopyTargetContainer: undefined,
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
    allowTransformationScript: boolean;
    autoCopyTargetContainer: string;
    availableDetectionMethods: any;
    availableMetadataInputFormats: any;
    availablePlateTemplates: any;
    backgroundUpload: boolean;
    description: string;
    domains: List<DomainDesign>;
    editableResults: boolean;
    editableRuns: boolean;
    metadataInputFormatHelp: any;
    moduleTransformScripts: Array<any>;
    name: string;
    protocolId: number;
    protocolParameters: any;
    protocolTransformScripts: any;
    providerName: string;
    saveScriptFiles: boolean;
    selectedDetectionMethod: any;
    selectedMetadataInputFormat: any;
    selectedPlateTemplate: any;
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

        return new AssayProtocolModel({
            ...raw,
            domains
        });
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
}
