// Consider having this implement Query.QueryColumn from @labkey/api
// commented out attributes are not used in app
import { Record } from 'immutable';
import { Filter, Query } from '@labkey/api';

import {
    CONCEPT_CODE_CONCEPT_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
} from '../internal/components/domainproperties/constants';
import { SCHEMAS } from '../internal/schemas';

import { isAllSamplesSchema } from '../internal/components/samples/utils';
import { SAMPLES_WITH_TYPES_FILTER } from '../internal/components/samples/constants';

import { SchemaQuery } from './SchemaQuery';

export class QueryLookup extends Record({
    containerFilter: undefined,
    containerPath: undefined,
    displayColumn: undefined,
    isPublic: false,
    keyColumn: undefined,
    junctionLookup: undefined,
    multiValued: undefined,
    queryName: undefined,
    schemaName: undefined,
    schemaQuery: undefined,
    table: undefined,
}) {
    declare containerFilter: Query.ContainerFilter;
    declare containerPath: string;
    declare displayColumn: string;
    declare isPublic: boolean;
    declare junctionLookup: string; // name of the column on the junction table that is also a lookup
    declare keyColumn: string;
    declare multiValued: string; // can be "junction", "value" or undefined. Server only support "junction" at this time
    // declare public: boolean; -- NOT ALLOWING DUE TO KEYWORD -- USE isPublic
    declare queryName: string;
    // declare schema: string; -- NOT ALLOWING -- USE schemaName
    declare schemaName: string;
    declare schemaQuery: SchemaQuery;
    // declare table: string; -- NOT ALLOWING -- USE queryName

    static create(rawLookup): QueryLookup {
        return new QueryLookup(
            Object.assign({}, rawLookup, {
                schemaQuery: SchemaQuery.create(rawLookup.schemaName, rawLookup.queryName, rawLookup.viewName),
            })
        );
    }

    hasQueryFilters(): boolean {
        return isAllSamplesSchema(this.schemaQuery);
    }

    getQueryFilters(): Filter.IFilter[] {
        // Issue 46037: Some plate-based assays (e.g., NAB) create samples with a bogus 'Material' sample type, which should get excluded here
        if (isAllSamplesSchema(this.schemaQuery)) {
            return [SAMPLES_WITH_TYPES_FILTER];
        } else {
            return undefined;
        }
    }
}

export class QueryColumn extends Record({
    align: undefined,
    // autoIncrement: undefined,
    // calculated: undefined,
    caption: undefined,
    conceptURI: null,
    // defaultScale: undefined,
    defaultValue: null,
    description: undefined,
    dimension: undefined,
    displayAsLookup: undefined,
    displayField: undefined,
    displayFieldSqlType: undefined,
    displayFieldJsonType: undefined,
    // excludeFromShifting: undefined,
    // ext: undefined,
    facetingBehaviorType: undefined,
    fieldKey: undefined,
    fieldKeyArray: undefined,
    fieldKeyPath: undefined,
    filterable: true,
    format: undefined,
    // friendlyType: undefined,
    hidden: undefined,
    inputType: undefined,
    // isAutoIncrement: undefined, // DUPLICATE
    // isHidden: undefined, // DUPLICATE
    isKeyField: undefined,
    // isMvEnabled: undefined,
    // isNullable: undefined,
    // isReadOnly: undefined,
    // isSelectable: undefined, // DUPLICATE
    // isUserEditable: undefined, // DUPLICATE
    // isVersionField: undefined,
    jsonType: undefined,
    // keyField: undefined,
    lookup: undefined,
    measure: undefined,
    multiValue: false,
    // mvEnabled: undefined,
    name: undefined,
    nameExpression: undefined,
    // nullable: undefined,
    phiProtected: undefined,
    protected: undefined,
    rangeURI: undefined,
    readOnly: undefined,
    // recommendedVariable: undefined,
    required: undefined,
    selectable: undefined,
    shortCaption: undefined,
    addToSystemView: undefined,
    removeFromViewCustomization: undefined,
    shownInDetailsView: undefined,
    shownInInsertView: undefined,
    shownInUpdateView: undefined,
    sortable: true,
    // sqlType: undefined,
    type: undefined,
    userEditable: undefined,
    validValues: undefined,
    // versionField: undefined,

    cell: undefined,
    columnRenderer: undefined,
    detailRenderer: undefined,
    helpTipRenderer: undefined,
    inputRenderer: undefined,
    previewOptions: false,
    removeFromViews: false,
    sorts: undefined,
    units: undefined,
    derivationDataScope: undefined,

    sourceOntology: undefined,
    conceptSubtree: undefined,
}) {
    declare align: string;
    // declare autoIncrement: boolean;
    // declare calculated: boolean;
    declare caption: string;
    declare conceptURI: string;
    // declare defaultScale: string;
    declare displayField?: string;
    declare displayFieldSqlType?: string;
    declare displayFieldJsonType?: string;
    declare defaultValue: any;
    declare description: string;
    declare dimension: boolean;
    declare displayAsLookup: boolean;
    // declare excludeFromShifting: boolean;
    // declare ext: any;
    declare facetingBehaviorType: string;
    declare fieldKey: string;
    declare fieldKeyArray: string[];
    declare fieldKeyPath: string;
    declare filterable: boolean;
    declare format: string;
    // declare friendlyType: string;
    declare hidden: boolean;
    declare inputType: string;
    // declare isAutoIncrement: boolean; // DUPLICATE
    // declare isHidden: boolean; // DUPLICATE
    declare isKeyField: boolean;
    // declare isMvEnabled: boolean;
    // declare isNullable: boolean;
    // declare isReadOnly: boolean;
    // declare isSelectable: boolean; // DUPLICATE
    // declare isUserEditable: boolean; // DUPLICATE
    // declare isVersionField: boolean;
    declare jsonType: string;
    // declare keyField: boolean;
    declare lookup: QueryLookup;
    declare measure: boolean;
    declare multiValue: boolean;
    // declare mvEnabled: boolean;
    declare name: string;
    declare nameExpression: string;
    // declare nullable: boolean;
    declare phiProtected: boolean;
    declare 'protected': boolean;
    declare rangeURI: string;
    declare readOnly: boolean;
    // declare recommendedVariable: boolean;
    declare required: boolean;
    declare selectable: boolean;
    declare shortCaption: string;
    declare addToSystemView: boolean;
    declare removeFromViewCustomization: boolean;
    declare shownInDetailsView: boolean;
    declare shownInInsertView: boolean;
    declare shownInUpdateView: boolean;
    declare sortable: boolean;
    // declare sqlType: string;
    declare type: string;
    declare userEditable: boolean;
    declare validValues: string[];
    // declare versionField: boolean;

    declare cell: Function;
    declare columnRenderer: string;
    declare detailRenderer: string;
    declare helpTipRenderer: string;
    declare inputRenderer: string;
    declare previewOptions: boolean;
    declare sorts: '+' | '-';
    declare removeFromViews: boolean; // strips this column from all ViewInfo definitions
    declare units: string;
    declare derivationDataScope: string;

    declare sourceOntology: string;
    declare conceptSubtree: string;

    static create(rawColumn): QueryColumn {
        if (rawColumn && rawColumn.lookup !== undefined) {
            return new QueryColumn(
                Object.assign({}, rawColumn, {
                    lookup: QueryLookup.create(rawColumn.lookup),
                })
            );
        }

        return new QueryColumn(rawColumn);
    }

    static DATA_INPUTS = 'DataInputs';
    static MATERIAL_INPUTS = 'MaterialInputs';
    static ALIQUOTED_FROM = 'AliquotedFrom';
    static ALIQUOTED_FROM_CAPTION = 'Aliquoted From';
    static ALIQUOTED_FROM_LSID = 'AliquotedFromLSID';

    get index(): string {
        // See Issues 41621, 45148
        // The server provides data indices into row data from selectRows based on FieldKey. In the
        // 17.1 SelectRowsResponse format these indices are constructed based off the associated column
        // fieldKey as follows:
        // 1. If the fieldKey is made up of multiple parts (e.g: "parent/someKey"), then the data index
        //    is FieldKey encoded.
        // 2. If the fieldKey is made up of one part (e.g: "someKey"), then the data index is not FieldKey encoded.

        // return if the column does not have a fieldKey at all
        if (!this.fieldKey) return;

        // "fieldKey" is expected to be FieldKey encoded so the presence of "/" indicates
        // this is a multi-part fieldKey which means the data index will be FieldKey encoded as well.
        if (this.fieldKey.indexOf('/') > -1) {
            return this.fieldKey;
        }

        // "fieldKeyPath" is used for getQueryDetails calls when a fk is passed as a prop, to get the child fields
        // for a lookup
        if (this.fieldKeyPath?.indexOf('/') > -1) {
            return this.fieldKeyPath;
        }

        // This is a single-part fieldKey so the data index will NOT be FieldKey encoded.
        if (this.fieldKeyArray.length === 1) {
            return this.fieldKeyArray[0];
        }

        // We're in an unexpected state. The "fieldKey" is single-part but the
        // "fieldKeyArray" is non-singular (made up of zero or two or more parts).
        // Fallback to old behavior.
        return this.fieldKeyArray?.join('/');
    }

    isExpInput(checkLookup = true): boolean {
        return this.isDataInput(checkLookup) || this.isMaterialInput(checkLookup);
    }

    isDataInput(checkLookup = true): boolean {
        return (
            this.name &&
            this.name.toLowerCase().indexOf(QueryColumn.DATA_INPUTS.toLowerCase()) !== -1 &&
            (!checkLookup || this.isLookup())
        );
    }

    isAliquotParent(): boolean {
        return (
            this.name &&
            (this.name.toLowerCase() === QueryColumn.ALIQUOTED_FROM.toLowerCase() ||
                this.name.toLowerCase() === QueryColumn.ALIQUOTED_FROM_LSID.toLowerCase())
        );
    }

    isEditable(): boolean {
        return !this.readOnly && this.userEditable && this.shownInUpdateView;
    }

    isJunctionLookup(): boolean {
        return this.isLookup() && this.lookup.multiValued === 'junction';
    }

    isLookup(): boolean {
        return this.lookup !== undefined;
    }

    // Issue 39911: a public lookup indicates that it is available in the user schema (i.e. can be seen in the schema browser)
    isPublicLookup(): boolean {
        return this.isLookup() && this.lookup.isPublic;
    }

    isSampleLookup(): boolean {
        if (!this.isLookup()) {
            return false;
        }

        // Issue 44845: Support resolving sample lookup columns by Concept URI
        if (this.conceptURI === SAMPLE_TYPE_CONCEPT_URI) {
            return true;
        }

        // Issue 35881: Ensure that a column is a valid lookup to one of the following:
        // - exp.Materials
        // - samples.* (any sample set)
        const lookupSQ = this.lookup.schemaQuery;
        return SCHEMAS.EXP_TABLES.MATERIALS.isEqual(lookupSQ) || lookupSQ.hasSchema(SCHEMAS.SAMPLE_SETS.SCHEMA);
    }

    isMaterialInput(checkLookup = true): boolean {
        return (
            this.name &&
            this.name.toLowerCase().indexOf(QueryColumn.MATERIAL_INPUTS.toLowerCase()) !== -1 &&
            (!checkLookup || this.isLookup())
        );
    }

    get isDetailColumn(): boolean {
        return !this.removeFromViews && this.shownInDetailsView === true;
    }

    get isUpdateColumn(): boolean {
        return this.removeFromViews !== true && this.isEditable() && this.fieldKeyArray.length === 1;
    }

    get isUniqueIdColumn(): boolean {
        return this.conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI;
    }

    get isConceptCodeColumn(): boolean {
        return this.conceptURI === CONCEPT_CODE_CONCEPT_URI;
    }

    isImportColumn(importName: string): boolean {
        if (!importName) return false;

        const lcName = importName.toLowerCase().trim();
        return (
            this.caption?.toLowerCase() === lcName ||
            this.caption?.replace(' ', '').toLowerCase() === lcName ||
            this.name?.toLowerCase() === lcName ||
            this.fieldKey?.toLowerCase() === lcName
        );
    }

    // TODO is this redundant with getDisplayFieldKey?
    resolveFieldKey(): string {
        let fieldKey: string;

        if (this.isLookup()) {
            fieldKey = [this.fieldKey, this.lookup.displayColumn.replace(/\//g, '$S')].join('/');
        } else {
            fieldKey = this.fieldKey;
        }

        return fieldKey;
    }

    get lookupKey(): string {
        if (!this.lookup) return undefined;

        return [this.lookup.schemaName, this.lookup.queryName, this.fieldKey].join('|');
    }

    get isFileInput(): boolean {
        return this.inputType === 'file';
    }

    allowFaceting(): boolean {
        switch (this.facetingBehaviorType) {
            case 'ALWAYS_ON':
                return true;
            case 'ALWAYS_OFF':
                return false;
            case 'AUTOMATIC':
                // auto rules are if the column is a lookup or dimension
                // OR if it is of type : (boolean, int, date, text), multiline excluded
                if (this.lookup || this.dimension) return true;
                else if (
                    this.jsonType == 'boolean' ||
                    this.jsonType == 'int' ||
                    (this.jsonType == 'string' && this.inputType != 'textarea')
                )
                    return true;
        }

        return false;
    }

    getDisplayFieldKey(): string {
        return this.isLookup() && this.displayField ? this.displayField : this.fieldKey;
    }

    getDisplayFieldJsonType(): string {
        return (this.displayFieldJsonType ? this.displayFieldJsonType : this.jsonType) ?? 'string';
    }

    get customViewTitle(): string {
        return this.caption === this.name ? '' : this.caption;
    }
}

export function insertColumnFilter(col: QueryColumn, includeFileInputs = true): boolean {
    return (
        col &&
        col.removeFromViews !== true &&
        col.shownInInsertView === true &&
        !col.readOnly &&
        col.userEditable &&
        col.fieldKeyArray.length === 1 &&
        (includeFileInputs || !col.isFileInput)
    );
}
