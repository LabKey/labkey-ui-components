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
import { fromJS, List, Map, Record } from 'immutable';
import { Domain, getServerContext } from '@labkey/api';
import { immerable } from 'immer';

import { caseInsensitive, SCHEMAS } from '../../..';

import {
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOMAIN_FILTER_HASANYVALUE,
    INT_RANGE_URI,
    MAX_TEXT_LENGTH,
    SAMPLE_TYPE_CONCEPT_URI,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI,
    UNLIMITED_TEXT_LENGTH,
    USER_RANGE_URI,
} from './constants';
import {
    ATTACHMENT_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    LOOKUP_TYPE,
    PARTICIPANT_TYPE,
    PropDescType,
    PROP_DESC_TYPES,
    READONLY_DESC_TYPES,
    SAMPLE_TYPE,
    TEXT_TYPE,
    USERS_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
} from './PropDescType';

export interface IFieldChange {
    id: string;
    value: any;
}

export interface IBannerMessage {
    message: string;
    messageType: string;
}

export interface ITypeDependentProps {
    index: number;
    domainIndex: number;
    label: string;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any;
    lockType: string;
}

export const SAMPLE_TYPE_OPTION_VALUE = `${SAMPLE_TYPE.rangeURI}|all`;

interface IDomainDesign {
    name: string;
    container: string;
    description?: string;
    domainURI: string;
    domainId: number;
    allowFileLinkProperties: boolean;
    allowAttachmentProperties: boolean;
    allowFlagProperties: boolean;
    showDefaultValueSettings: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    fields?: List<DomainField>;
    indices?: List<DomainIndex>;
    domainException?: DomainException;
    newDesignFields?: List<DomainField>; // set of fields to initialize a manually created design
    instructions?: string;
    domainKindName?: string;
}

export class DomainDesign
    extends Record({
        name: undefined,
        container: undefined,
        description: undefined,
        domainURI: undefined,
        domainId: null,
        allowFileLinkProperties: false,
        allowAttachmentProperties: false,
        allowFlagProperties: true,
        showDefaultValueSettings: false,
        defaultDefaultValueType: undefined,
        defaultValueOptions: List<string>(),
        fields: List<DomainField>(),
        indices: List<DomainIndex>(),
        domainException: undefined,
        mandatoryFieldNames: List<string>(),
        reservedFieldNames: List<string>(),
        newDesignFields: undefined,
        instructions: undefined,
        domainKindName: undefined,
    })
    implements IDomainDesign {
    name: string;
    container: string;
    description: string;
    domainURI: string;
    domainId: number;
    allowFileLinkProperties: boolean;
    allowAttachmentProperties: boolean;
    allowFlagProperties: boolean;
    showDefaultValueSettings: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    fields: List<DomainField>;
    indices: List<DomainIndex>;
    domainException: DomainException;
    mandatoryFieldNames: List<string>;
    reservedFieldNames: List<string>;
    newDesignFields?: List<DomainField>; // Returns a set of fields to initialize a manually created design
    instructions: string;
    domainKindName: string;

    static create(rawModel: any, exception?: any): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();
        let defaultValueOptions = List<DomainField>();
        let mandatoryFieldNames = List<string>();

        const domainException = DomainException.create(exception, exception ? exception.severity : undefined);

        if (rawModel) {
            if (rawModel.mandatoryFieldNames) {
                mandatoryFieldNames = List<string>(rawModel.mandatoryFieldNames.map(name => name.toLowerCase()));
            }

            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields, mandatoryFieldNames);
            }

            if (rawModel.indices) {
                indices = DomainIndex.fromJS(rawModel.indices);
            }

            if (rawModel.defaultValueOptions) {
                for (let i = 0; i < rawModel.defaultValueOptions.length; i++) {
                    defaultValueOptions = defaultValueOptions.push(rawModel.defaultValueOptions[i]);
                }
            }
        }

        return new DomainDesign({
            ...rawModel,
            fields,
            indices,
            defaultValueOptions,
            domainException,
        });
    }

    static serialize(dd: DomainDesign): any {
        const json = dd.toJS();
        json.fields = dd.fields.map(field => DomainField.serialize(field)).toArray();

        // remove non-serializable fields
        delete json.domainException;
        delete json.newDesignFields;

        return json;
    }

    hasErrors(): boolean {
        return (
            this.domainException !== undefined &&
            this.domainException.errors !== undefined &&
            this.domainException.errors.size > 0 &&
            this.domainException.severity === SEVERITY_LEVEL_ERROR
        );
    }

    hasException(): boolean {
        return this.domainException !== undefined;
    }

    isNameSuffixMatch(name: string): boolean {
        return this.name && this.name.endsWith(name + ' Fields');
    }

    // Issue 38399: helper for each designer model to know if there are field-level errors
    hasInvalidFields(): boolean {
        return this.getInvalidFields().size > 0;
    }

    getInvalidFields(): Map<number, DomainField> {
        let invalid = Map<number, DomainField>();

        for (let i = 0; i < this.fields.size; i++) {
            const field = this.fields.get(i);
            if (field.hasErrors()) {
                invalid = invalid.set(i, field);
            }
        }

        return invalid;
    }

    hasDefaultValueOption(value: string): boolean {
        return this.defaultValueOptions.some(option => option === value);
    }

    hasInvalidNameField(defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        if (this.fields && this.fields.size > 0 && defaultNameFieldConfig && defaultNameFieldConfig.name) {
            const nameField = this.fields.find(field => {
                return field && field.name && field.name.toLowerCase() === defaultNameFieldConfig.name.toLowerCase();
            });

            return nameField !== undefined;
        }

        return false;
    }

    getFirstFieldError(): FieldErrors {
        const invalidFields = this.getInvalidFields();
        return invalidFields.size > 0 ? invalidFields.first().getErrors() : undefined;
    }

    getDomainContainer(): string {
        const currentContainer = getServerContext().container.id;
        return this.container || currentContainer;
    }

    isSharedDomain(): boolean {
        const currentContainer = getServerContext().container.id;
        return this.getDomainContainer() !== currentContainer;
    }

    findFieldIndexByName(fieldName: string): number {
        return this.fields.findIndex((field: DomainField) => fieldName && field.name === fieldName);
    }
}

interface IDomainIndex {
    columns: string[] | List<string>;
    type: 'primary' | 'unique';
}

export class DomainIndex
    extends Record({
        columns: List<string>(),
        type: undefined,
    })
    implements IDomainIndex {
    columns: List<string>;
    type: 'primary' | 'unique';

    static fromJS(rawIndices: IDomainIndex[]): List<DomainIndex> {
        let indices = List<DomainIndex>();

        for (let i = 0; i < rawIndices.length; i++) {
            indices = indices.push(new DomainIndex(fromJS(rawIndices[i])));
        }

        return indices;
    }
}

export enum FieldErrors {
    NONE = '',
    MISSING_SCHEMA_QUERY = 'Missing required lookup target schema or table property.',
    MISSING_DATA_TYPE = 'Please provide a data type for each field.',
    MISSING_FIELD_NAME = 'Please provide a name for each field.',
    MISSING_ONTOLOGY_PROPERTIES = 'Missing required ontology source or label field property.',
}

export interface IConditionalFormat {
    formatFilter: string;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    textColor?: string;
    backgroundColor?: string;
}

export class ConditionalFormat
    extends Record({
        formatFilter: undefined,
        bold: false,
        italic: false,
        strikethrough: false,
        textColor: undefined,
        backgroundColor: undefined,
    })
    implements IConditionalFormat {
    formatFilter: string;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    textColor?: string;
    backgroundColor?: string;

    constructor(values?: { [key: string]: any }) {
        // filter is a reserved work on Records so change to formatFilter and update for HASANYVALUE lacking a filter symbol
        if (values && !values.get('formatFilter')) {
            values = values.set(
                'formatFilter',
                values.get('filter').replace('~=', '~' + DOMAIN_FILTER_HASANYVALUE + '=')
            );
        }
        super(values);
    }

    static fromJS(rawCondFormat: ConditionalFormat[]): List<ConditionalFormat> {
        let condFormats = List<ConditionalFormat>();

        for (let i = 0; i < rawCondFormat.length; i++) {
            condFormats = condFormats.push(new ConditionalFormat(fromJS(rawCondFormat[i])));
        }

        return condFormats;
    }

    static serialize(cfs: any[]): any {
        // Change formatFilter back to filter as that is what API is expecting
        for (let i = 0; i < cfs.length; i++) {
            cfs[i].filter = cfs[i].formatFilter.replace(DOMAIN_FILTER_HASANYVALUE, '');
            delete cfs[i].formatFilter;
        }

        return cfs;
    }
}

export interface IPropertyValidatorProperties {
    failOnMatch: boolean;
}

export class PropertyValidatorProperties
    extends Record({
        failOnMatch: false,
    })
    implements IPropertyValidatorProperties {
    failOnMatch: boolean;
}

export interface IPropertyValidator {
    type: string;
    name: string;
    properties: PropertyValidatorProperties;
    errorMessage?: string;
    description?: string;
    new: boolean;
    rowId?: number;
    expression?: string;
}

export class PropertyValidator
    extends Record({
        type: undefined,
        name: undefined,
        properties: new PropertyValidatorProperties(),
        errorMessage: undefined,
        description: undefined,
        new: true,
        rowId: undefined,
        expression: undefined,
    })
    implements IPropertyValidator {
    type: string;
    name: string;
    properties: PropertyValidatorProperties;
    errorMessage?: string;
    description?: string;
    new: boolean;
    rowId?: number;
    expression?: string;

    static fromJS(rawPropertyValidator: any[], type: string): List<PropertyValidator> {
        let propValidators = List<PropertyValidator>();

        let newPv;
        for (let i = 0; i < rawPropertyValidator.length; i++) {
            if (
                (type === 'Range' && rawPropertyValidator[i].type === 'Range') ||
                (type === 'RegEx' && rawPropertyValidator[i].type === 'RegEx') ||
                (type === 'Lookup' && rawPropertyValidator[i].type === 'Lookup')
            ) {
                rawPropertyValidator[i]['properties'] = new PropertyValidatorProperties(
                    fromJS(rawPropertyValidator[i]['properties'])
                );
                newPv = new PropertyValidator(rawPropertyValidator[i]);

                // Special case for filters HAS ANY VALUE not having a symbol
                if (newPv.get('expression') !== undefined && newPv.get('expression') !== null) {
                    newPv = newPv.set(
                        'expression',
                        newPv.get('expression').replace('~=', '~' + DOMAIN_FILTER_HASANYVALUE + '=')
                    ) as PropertyValidator;
                }

                // newPv = newPv.set("properties", new PropertyValidatorProperties(fromJS(rawPropertyValidator[i]['properties'])));
                propValidators = propValidators.push(newPv);
            }
        }

        return propValidators;
    }

    static serialize(pvs: any[]): any {
        for (let i = 0; i < pvs.length; i++) {
            pvs[i].expression = pvs[i].expression.replace(DOMAIN_FILTER_HASANYVALUE, '');
        }

        return pvs;
    }
}

interface ILookupConfig {
    lookupContainer?: string;
    lookupQuery?: string;
    lookupSchema?: string;
    lookupQueryValue?: string;
    lookupType?: PropDescType;
}

export interface IDomainField {
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
    lookupValidator?: PropertyValidator;
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
    required?: boolean;
    recommendedVariable?: boolean;
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
    disablePhiLevel?: boolean;
    lockExistingField?: boolean;
    sourceOntology?: string;
    conceptLabelColumn?: string;
    conceptImportColumn?: string;
}

export class DomainField
    extends Record({
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
        lookupValidator: undefined,
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
        scale: MAX_TEXT_LENGTH,
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
        lockType: DOMAIN_FIELD_NOT_LOCKED,
        wrappedColumnName: undefined,
        disablePhiLevel: false,
        lockExistingField: false,
        sourceOntology: undefined,
        conceptLabelColumn: undefined,
        conceptImportColumn: undefined,
    })
    implements IDomainField {
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
    lookupValidator?: PropertyValidator;
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
    wrappedColumnName?: string;
    disablePhiLevel?: boolean;
    lockExistingField?: boolean;
    sourceOntology?: string;
    conceptLabelColumn?: string;
    conceptImportColumn?: string;

    static create(rawField: any, shouldApplyDefaultValues?: boolean, mandatoryFieldNames?: List<string>): DomainField {
        const baseField = DomainField.resolveBaseProperties(rawField, mandatoryFieldNames);
        const { dataType } = baseField;
        const lookup = DomainField.resolveLookupConfig(rawField, dataType);
        let field = new DomainField(
            Object.assign(rawField, baseField, {
                ...lookup,
                original: {
                    dataType,
                    conceptURI: rawField.conceptURI,
                    rangeURI:
                        rawField.propertyId !== undefined || rawField.wrappedColumnName !== undefined
                            ? rawField.rangeURI // Issue 40795: need rangURI for alias field (query metadata) to get other available types in the datatype dropdown
                            : undefined, // Issue 38366: only need to use rangeURI filtering for already saved field/property
                },
            })
        );

        if (rawField.conditionalFormats) {
            field = field.set(
                'conditionalFormats',
                ConditionalFormat.fromJS(rawField.conditionalFormats)
            ) as DomainField;
        }

        if (rawField.propertyValidators) {
            field = field.set(
                'rangeValidators',
                PropertyValidator.fromJS(rawField.propertyValidators, 'Range')
            ) as DomainField;
            field = field.set(
                'regexValidators',
                PropertyValidator.fromJS(rawField.propertyValidators, 'RegEx')
            ) as DomainField;

            const lookups = PropertyValidator.fromJS(rawField.propertyValidators, 'Lookup');
            if (lookups && lookups.size > 0) {
                field = field.set(
                    'lookupValidator',
                    PropertyValidator.fromJS(rawField.propertyValidators, 'Lookup').get(0)
                ) as DomainField;
            }
        }

        if (shouldApplyDefaultValues) {
            field = DomainField.updateDefaultValues(field);
        }

        return field;
    }

    private static resolveLookupConfig(rawField: Partial<IDomainField>, dataType: PropDescType): ILookupConfig {
        const lookupType = LOOKUP_TYPE.set('rangeURI', rawField.rangeURI) as PropDescType;
        const lookupContainer = rawField.lookupContainer === null ? undefined : rawField.lookupContainer;
        const lookupSchema = resolveLookupSchema(rawField, dataType);
        const lookupQuery =
            rawField.lookupQuery || (dataType === SAMPLE_TYPE ? SCHEMAS.EXP_TABLES.MATERIALS.queryName : undefined);
        const lookupQueryValue = encodeLookup(lookupQuery, lookupType);

        return {
            lookupContainer,
            lookupSchema,
            lookupQuery,
            lookupType,
            lookupQueryValue,
        };
    }

    static fromJS(rawFields: IDomainField[], mandatoryFieldNames?: List<string>): List<DomainField> {
        let fields = List<DomainField>();

        for (let i = 0; i < rawFields.length; i++) {
            fields = fields.push(DomainField.create(rawFields[i], undefined, mandatoryFieldNames));
        }

        return fields;
    }

    static resolveBaseProperties(
        raw: Partial<IDomainField>,
        mandatoryFieldNames?: List<string>
    ): Partial<IDomainField> {
        const dataType = resolveDataType(raw);

        // lockType can either come from the rawField, or be based on the domain's mandatoryFieldNames
        const isMandatoryFieldMatch =
            mandatoryFieldNames !== undefined && raw.name && mandatoryFieldNames.contains(raw.name.toLowerCase());
        let lockType = raw.lockType || DOMAIN_FIELD_NOT_LOCKED;
        if (lockType === DOMAIN_FIELD_NOT_LOCKED && isMandatoryFieldMatch) {
            lockType = DOMAIN_FIELD_PARTIALLY_LOCKED;
        }

        const field = { dataType, lockType } as IDomainField;

        // Infer SampleId as SAMPLE_TYPE for sample manager and mark required
        if (isFieldNew(raw) && raw.name) {
            if (raw.name.localeCompare('SampleId', 'en', { sensitivity: 'accent' }) === 0) {
                field.dataType = SAMPLE_TYPE;
                field.conceptURI = SAMPLE_TYPE.conceptURI;
                field.rangeURI = SAMPLE_TYPE.rangeURI;
                field.required = true;
            }
        }

        return field;
    }

    static serialize(df: DomainField, fixCaseSensitivity = true): any {
        const json = df.toJS();

        if (!(df.dataType.isLookup() || df.dataType.isUser() || df.dataType.isSample())) {
            json.lookupContainer = null;
            json.lookupQuery = null;
            json.lookupSchema = null;
        }

        if (json.lookupContainer === undefined) {
            json.lookupContainer = null;
        }

        // for some reason the property binding server side cares about casing here for 'URL' and 'PHI'
        if (fixCaseSensitivity) {
            if (json.URL !== undefined) {
                json.url = json.URL;
                delete json.URL;
            }
            if (json.PHI !== undefined) {
                json.phi = json.PHI;
                delete json.PHI;
            }
        }

        if (json.conditionalFormats) {
            json.conditionalFormats = ConditionalFormat.serialize(json.conditionalFormats);
        }

        json.propertyValidators = [];
        if (json.rangeValidators) {
            json.propertyValidators = json.propertyValidators.concat(PropertyValidator.serialize(json.rangeValidators));
        }

        if (json.regexValidators) {
            json.propertyValidators = json.propertyValidators.concat(PropertyValidator.serialize(json.regexValidators));
        }

        if (json.lookupValidator) {
            json.propertyValidators = json.propertyValidators.concat(json.lookupValidator);
        }

        // Special case for users, needs different URI for uniqueness in UI but actually uses int URI
        if (json.rangeURI === USER_RANGE_URI) {
            json.rangeURI = INT_RANGE_URI;
        }

        // Issue 39938: revert back to max Integer length if user input is larger then 4000
        if (df.scale && (isNaN(df.scale) || df.scale > MAX_TEXT_LENGTH)) {
            json.scale = UNLIMITED_TEXT_LENGTH;
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
        delete json.lookupValidator;
        delete json.disablePhiLevel;
        delete json.lockExistingField;

        return json;
    }

    getErrors(): FieldErrors {
        if (this.dataType.isLookup() && (!this.lookupSchema || !this.lookupQuery)) {
            return FieldErrors.MISSING_SCHEMA_QUERY;
        }

        if (!(this.dataType && (this.dataType.rangeURI || this.rangeURI))) {
            return FieldErrors.MISSING_DATA_TYPE;
        }

        if (this.hasInvalidName()) {
            return FieldErrors.MISSING_FIELD_NAME;
        }

        if (this.dataType.isOntologyLookup() && (!this.sourceOntology || !this.conceptLabelColumn)) {
            return FieldErrors.MISSING_ONTOLOGY_PROPERTIES;
        }

        return FieldErrors.NONE;
    }

    hasInvalidName(): boolean {
        return (this.name === undefined || this.name === null || this.name.trim() === '');
    }

    hasErrors(): boolean {
        return this.getErrors() !== FieldErrors.NONE;
    }

    isNew(): boolean {
        return isFieldNew(this);
    }

    isSaved(): boolean {
        return isFieldSaved(this);
    }

    static hasRangeValidation(field: DomainField): boolean {
        return (
            field.dataType === INTEGER_TYPE ||
            field.dataType === DOUBLE_TYPE ||
            field.dataType === DATETIME_TYPE ||
            field.dataType === USERS_TYPE ||
            field.dataType === LOOKUP_TYPE
        );
    }

    static hasRegExValidation(field: DomainField): boolean {
        return field.dataType.isString();
    }

    static updateDefaultValues(field: DomainField): DomainField {
        const { dataType } = field;

        const config = {
            measure: DomainField.defaultValues(DOMAIN_FIELD_MEASURE, dataType),
            dimension: DomainField.defaultValues(DOMAIN_FIELD_DIMENSION, dataType),
        };

        const lookupConfig = dataType === SAMPLE_TYPE ? DomainField.resolveLookupConfig(field, dataType) : {};

        return field.merge(config, lookupConfig) as DomainField;
    }

    static defaultValues(prop: string, type: PropDescType): any {
        switch (prop) {
            case DOMAIN_FIELD_MEASURE:
                return type === INTEGER_TYPE || type === DOUBLE_TYPE;
            case DOMAIN_FIELD_DIMENSION:
                return type === LOOKUP_TYPE || type === USERS_TYPE || type === SAMPLE_TYPE;
            default:
                return false;
        }
    }
}

export function decodeLookup(value: string): { queryName: string; rangeURI: string } {
    const [rangeURI, queryName] = value ? value.split('|') : [undefined, undefined];

    return {
        queryName,
        rangeURI,
    };
}

export function encodeLookup(queryName: string, type: PropDescType): string {
    if (queryName) {
        return [type.rangeURI, queryName].join('|');
    }

    return undefined;
}

function resolveLookupSchema(rawField: Partial<IDomainField>, dataType: PropDescType): string {
    if (rawField.lookupSchema) return rawField.lookupSchema;

    if (dataType === SAMPLE_TYPE) return SCHEMAS.EXP_TABLES.SCHEMA;

    return undefined;
}

export function updateSampleField(field: Partial<DomainField>, sampleQueryValue?: string): DomainField {
    const { queryName, rangeURI = INT_RANGE_URI } = decodeLookup(sampleQueryValue);
    const lookupType = field.lookupType || LOOKUP_TYPE;
    const sampleField =
        queryName === 'all'
            ? {
                  // Use the exp.materials table for 'all'
                  lookupSchema: SCHEMAS.EXP_TABLES.SCHEMA,
                  lookupQuery: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                  lookupQueryValue: sampleQueryValue,
                  lookupType: field.lookupType.set('rangeURI', rangeURI),
                  rangeURI,
              }
            : {
                  // use the samples.<SampleType> table for specific sample types
                  lookupSchema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                  lookupQuery: queryName,
                  lookupQueryValue: sampleQueryValue || SAMPLE_TYPE_OPTION_VALUE,
                  lookupType: lookupType.set('rangeURI', rangeURI),
                  rangeURI,
              };

    return field.merge(sampleField) as DomainField;
}

function isFieldNew(field: Partial<IDomainField>): boolean {
    return field.propertyId === undefined;
}

function isFieldSaved(field: Partial<IDomainField>): boolean {
    return !isFieldNew(field) && field.propertyId !== 0;
}

export function resolveAvailableTypes(
    field: DomainField,
    availableTypes: List<PropDescType>,
    appPropertiesOnly?: boolean,
    showFilePropertyType?: boolean
): List<PropDescType> {
    // field has not been saved -- display all property types allowed by app
    // Issue 40795: need to check wrappedColumnName for alias field in query metadata editor and resolve the datatype fields
    if (field.isNew() && field.wrappedColumnName == undefined) {
        return appPropertiesOnly
            ? (availableTypes.filter(type => isPropertyTypeAllowed(type, showFilePropertyType)) as List<PropDescType>)
            : availableTypes;
    }

    // compare against original types as the field's values are volatile
    const { rangeURI } = field.original;

    // field has been saved -- display eligible propTypes
    let filteredTypes = availableTypes
        .filter(type => {
            // Can always return to the original type for field
            if (type.name === field.dataType.name) return true;

            if (!acceptablePropertyType(type, rangeURI)) return false;

            if (appPropertiesOnly) {
                return isPropertyTypeAllowed(type, showFilePropertyType);
            }

            return true;
        })
        .toList();

    // Issue 39341: if the field type is coming from the server as a type we don't support in new field creation, add it to the list
    if (!filteredTypes.contains(field.dataType)) {
        filteredTypes = filteredTypes.push(field.dataType);
    }

    return filteredTypes;
}

function isPropertyTypeAllowed(type: PropDescType, includeFileType: boolean): boolean {
    // We allow file type for some domains based on the parameter
    if (type === FILE_TYPE) return includeFileType;

    // We are excluding the field types below for the App
    return ![LOOKUP_TYPE, PARTICIPANT_TYPE, FLAG_TYPE, ATTACHMENT_TYPE, ONTOLOGY_LOOKUP_TYPE].includes(type);
}

function acceptablePropertyType(type: PropDescType, rangeURI: string): boolean {
    if (type.isLookup()) {
        return rangeURI === INT_RANGE_URI || rangeURI === STRING_RANGE_URI;
    }

    if (type.isSample()) {
        return rangeURI === INT_RANGE_URI;
    }

    if (type.isOntologyLookup()) {
        return rangeURI === STRING_RANGE_URI;
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
}

function resolveDataType(rawField: Partial<IDomainField>): PropDescType {
    let type: PropDescType;

    if (!isFieldNew(rawField) || rawField.rangeURI !== undefined) {
        if (rawField.conceptURI === SAMPLE_TYPE_CONCEPT_URI) return SAMPLE_TYPE;

        if (rawField.dataType) {
            return rawField.dataType;
        }

        type = PROP_DESC_TYPES.find(type => {
            // handle matching rangeURI and conceptURI
            if (type.rangeURI === rawField.rangeURI && !type.isUser()) {
                if (
                    !rawField.lookupQuery &&
                    ((!type.conceptURI && !rawField.conceptURI) || type.conceptURI === rawField.conceptURI)
                ) {
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
            else if (type.isUser() && rawField.lookupQuery && rawField.lookupQuery === 'users') {
                return true;
            }

            return false;
        });

        // Issue 39341: support for a few field types that are used in certain domains but are not supported for newly created fields
        if (!type) {
            type = READONLY_DESC_TYPES.find(type => type.rangeURI === rawField.rangeURI);
        }
    }

    return type ? type : TEXT_TYPE;
}

interface IColumnInfoLite {
    friendlyType?: string;
    isKeyField?: boolean;
    jsonType?: string;
    name?: string;
}

export class ColumnInfoLite
    extends Record({
        friendlyType: undefined,
        isKeyField: false,
        jsonType: undefined,
        name: undefined,
    })
    implements IColumnInfoLite {
    friendlyType?: string;
    isKeyField?: boolean;
    jsonType?: string;
    name?: string;

    static create(raw: IColumnInfoLite): ColumnInfoLite {
        return new ColumnInfoLite(raw);
    }
}

interface IQueryInfoLite {
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
}

export class QueryInfoLite
    extends Record({
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
        viewDataUrl: undefined,
    })
    implements IQueryInfoLite {
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
        return new QueryInfoLite(
            Object.assign({}, raw, {
                columns: raw.columns ? List((raw.columns as any).map(c => ColumnInfoLite.create(c))) : List(),
                schemaName,
            })
        );
    }

    getLookupInfo(rangeURI?: string): List<{ name: string; type: PropDescType }> {
        let infos = List<{ name: string; type: PropDescType }>();

        // allow for queries with only 1 primary key or with 2 primary key columns when one of them is container (see Issue 39879)
        let pkCols =
            this.getPkColumns().size > 1
                ? this.getPkColumns()
                      .filter(col => col.name.toLowerCase() !== 'container')
                      .toList()
                : this.getPkColumns();

        if (pkCols.size === 1) {
            // Sample Type hack (ported from DomainEditorServiceBase.java)
            if (this.schemaName.toLowerCase() === 'samples') {
                const nameCol = this.columns.find(c => c.name.toLowerCase() === 'name');

                if (nameCol) {
                    pkCols = pkCols.push(nameCol);
                }
            }

            pkCols.forEach(pk => {
                const type = PROP_DESC_TYPES.find(
                    propType => propType.name.toLowerCase() === pk.jsonType.toLowerCase()
                );

                // if supplied, apply rangeURI matching filter
                if (type && (rangeURI === undefined || rangeURI === type.rangeURI)) {
                    infos = infos.push({
                        name: this.name,
                        type,
                    });
                }
            });
        }

        return infos;
    }

    getPkColumns(): List<ColumnInfoLite> {
        return this.columns.filter(c => c.isKeyField).toList();
    }
}

// modeled after the JSON object received during server side error (except the severity).
interface IDomainException {
    exception: string;
    success: boolean;
    severity: string;
    errors?: List<DomainFieldError>;
}

// DomainException is used for both server side and client side errors.
// For server side, DomainException object is constructed in actions.ts (see saveDomain()) on failure while saving or creating a domain.
// For client side, DomainException object is constructed in actions.ts (see handleDomainUpdates()) while updating the domain.
export class DomainException
    extends Record({
        exception: undefined,
        success: undefined,
        severity: undefined,
        domainName: undefined,
        errors: List<DomainFieldError>(),
    })
    implements IDomainException {
    exception: string;
    success: boolean;
    severity: string;
    domainName: string;
    errors?: List<DomainFieldError>;

    static create(rawModel: any, severityLevel): DomainException {
        if (rawModel && rawModel.exception) {
            let errors = List<DomainFieldError>();
            if (rawModel.errors) {
                errors = DomainFieldError.fromJS(rawModel.errors, severityLevel);
            }

            // warnings will only be there if there are no errors, so looking only the first one
            let severity = severityLevel;
            const hasOnlyWarnings = errors.find(error => error.severity === SEVERITY_LEVEL_WARN);
            if (hasOnlyWarnings) {
                severity = SEVERITY_LEVEL_WARN;
            }

            const domainName = this.getDomainNameFromException(rawModel.exception);
            if (domainName) {
                const prefix = domainName + ' -- ';
                errors = errors.map(err => {
                    const parts = err.message.split(prefix);
                    return err.set('message', parts.length > 1 ? parts[1] : parts[0]);
                }) as List<DomainFieldError>;
            }
            const exception = errors.isEmpty() ? rawModel.exception : this.getExceptionMessage(errors);

            return new DomainException({
                exception,
                success: rawModel.success,
                severity,
                domainName,
                errors,
            });
        }

        return undefined;
    }

    static clientValidationExceptions(exception: string, fields: Map<number, DomainField>): DomainException {
        let fieldErrors = List<DomainFieldError>();

        fields.forEach((field, index) => {
            fieldErrors = fieldErrors.push(
                new DomainFieldError({
                    message: field.getErrors(),
                    fieldName: field.get('name'),
                    propertyId: field.get('propertyId'),
                    severity: SEVERITY_LEVEL_ERROR,
                    serverError: false,
                    rowIndexes: List<number>([index]),
                    newRowIndexes: undefined,
                })
            );
        });

        return new DomainException({
            exception,
            success: false,
            severity: SEVERITY_LEVEL_ERROR,
            errors: fieldErrors,
        });
    }

    static getDomainNameFromException(message: string): string {
        const msgParts = message.split(' -- ');
        if (msgParts.length > 1) {
            return msgParts[0];
        }

        return undefined;
    }

    // merge warnings with an incoming server side errors so that both server and pre-existing client side warning can be shown on the banner
    static mergeWarnings(domain: DomainDesign, exception: DomainException) {
        // merge pre-existing warnings on the domain
        if (domain && domain.hasException()) {
            const existingWarnings = domain.domainException
                .get('errors')
                .filter(e => e.severity === SEVERITY_LEVEL_WARN);
            const serverSideErrors = exception.get('errors');
            const allErrors = serverSideErrors.concat(existingWarnings);

            return exception.set('errors', allErrors);
        }

        return exception.set('errors', exception.errors);
    }

    static addRowIndexesToErrors(domain: DomainDesign, exceptionFromServer: DomainException): DomainException {
        let allFieldErrors = exceptionFromServer.get('errors');

        allFieldErrors = allFieldErrors.map(error => {
            const indices = domain.fields.reduce((indexList, field, idx, iter): List<number> => {
                if (
                    ((field.name === undefined || field.name === '') && error.get('fieldName') === undefined) ||
                    (field.propertyId !== 0 &&
                        field.propertyId !== undefined &&
                        error.get('propertyId') === field.propertyId) ||
                    (field.name !== undefined &&
                        error.get('fieldName') !== undefined &&
                        field.name.toLowerCase() === error.get('fieldName').toLowerCase())
                ) {
                    indexList = indexList.push(idx);
                }

                return indexList;
            }, List<number>());

            return error.merge({ rowIndexes: indices });
        });

        return exceptionFromServer.set('errors', allFieldErrors) as DomainException;
    }

    static getExceptionMessage(errors: List<DomainFieldError>) {
        let fieldErrorsCount = 0;
        let generalErrorMsg = '';
        let singleFieldError = '';
        errors.toArray().forEach(error => {
            if (error.fieldName !== undefined && error.fieldName !== '') {
                // Field error
                fieldErrorsCount++;
                singleFieldError = error.message;
            } else {
                // General error
                generalErrorMsg += error.message + ' \n';
            }
        });
        return fieldErrorsCount > 1
            ? 'You have ' + fieldErrorsCount + ' field errors. ' + generalErrorMsg
            : singleFieldError + ' ' + generalErrorMsg;
    }
}

interface IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    rowIndexes: List<number>;
    newRowIndexes?: List<number>; // for drag and drop
}

export class DomainFieldError
    extends Record({
        message: undefined,
        fieldName: undefined,
        propertyId: undefined,
        severity: undefined,
        serverError: undefined,
        rowIndexes: List<number>(),
        newRowIndexes: undefined,
        extraInfo: undefined,
    })
    implements IDomainFieldError {
    message: string;
    fieldName: string;
    propertyId?: number;
    severity?: string;
    serverError: boolean;
    rowIndexes: List<number>;
    newRowIndexes?: List<number>;
    extraInfo?: string;

    static fromJS(errors: any[], severityLevel: string): List<DomainFieldError> {
        let fieldErrors = List<DomainFieldError>();

        const hasErrors = errors.find(error => error.severity === SEVERITY_LEVEL_ERROR);

        for (let i = 0; i < errors.length; i++) {
            // stripping out server side warnings when there are errors
            if (errors[i].id === 'ServerWarning' && hasErrors) continue;

            // empty field name and property id comes in as "form" string from the server, resetting it to undefined here
            const fieldName = errors[i].id === 'form' && errors[i].field === 'form' ? undefined : errors[i].field;
            const propertyId =
                (errors[i].id === 'form' && errors[i].field === 'form') || errors[i].id < 1 ? undefined : errors[i].id;
            const severity = errors[i].severity ? errors[i].severity : severityLevel;

            const domainFieldError = new DomainFieldError({
                fieldName,
                propertyId,
                message: errors[i].message,
                extraInfo: errors[i].extraInfo,
                severity,
                serverError: true,
                rowIndexes: errors[i].rowIndexes ? errors[i].rowIndexes : List<number>(),
            });
            fieldErrors = fieldErrors.push(domainFieldError);
        }

        return fieldErrors;
    }
}

export type HeaderRenderer = (config: IAppDomainHeader) => any;

export interface IAppDomainHeader {
    domain: DomainDesign;
    domainIndex: number;
    modelDomains?: List<DomainDesign>;
    onChange?: (changes: List<IFieldChange>, index: number, expand: boolean) => void;
    onAddField?: (fieldConfig: Partial<IDomainField>) => void;
    onDomainChange?: (index: number, updatedDomain: DomainDesign) => void;
}

export type DomainPanelStatus = 'INPROGRESS' | 'TODO' | 'COMPLETE' | 'NONE';

export interface IDomainFormDisplayOptions {
    hideRequired?: boolean;
    hideValidators?: boolean;
    isDragDisabled?: boolean;
    hideTextOptions?: boolean;
    phiLevelDisabled?: boolean;
    hideAddFieldsButton?: boolean;
    disableMvEnabled?: boolean;
    hideImportData?: boolean;
}

/**
 * General object to describe a DomainKind as received from Domain.getDomainDetails
 *
 * @property domainDesign The fields found on all items of this domain (e.g., copy per item)
 * @property options The fields and properties shared by this type (e.g., one copy) ('options' used to match existing LKS api)
 * @property domainKindName The name of the domainkind type this represents, currently supported can be found in Domain.KINDS
 */
export class DomainDetails extends Record({
    domainDesign: undefined,
    options: undefined,
    domainKindName: undefined,
    nameReadOnly: false,
}) {
    domainDesign: DomainDesign;
    options: Map<string, any>;
    domainKindName: string;
    nameReadOnly?: boolean;

    static create(rawDesign: Map<string, any> = Map(), domainKindType: string = Domain.KINDS.UNKNOWN): DomainDetails {
        let design;
        if (rawDesign) {
            const domainDesign = DomainDesign.create(rawDesign.get('domainDesign'));
            const domainKindName = rawDesign.get('domainKindName', domainKindType);
            const options = Map(rawDesign.get('options'));
            const nameReadOnly = rawDesign.get('nameReadOnly');
            design = new DomainDetails({ domainDesign, domainKindName, options, nameReadOnly });
        } else {
            design = new DomainDetails({
                domainDesign: DomainDesign.create(null),
                domainKindName: domainKindType,
                options: Map<string, any>(),
            });
        }

        return design;
    }
}

export interface DomainFieldIndexChange {
    originalIndex: number;
    newIndex: number;
}

export class OntologyModel {
    [immerable] = true;

    rowId: number;
    abbreviation: string;
    name: string;

    constructor(values?: Partial<OntologyModel>) {
        Object.assign(this, values);
    }

    static create(raw: any): OntologyModel {
        return new OntologyModel({
            rowId: caseInsensitive(raw, 'RowId').value,
            name: caseInsensitive(raw, 'Name').value,
            abbreviation: caseInsensitive(raw, 'Abbreviation').value,
        });
    }

    getLabel() {
        return this.name + ' (' + this.abbreviation + ')';
    }
}
