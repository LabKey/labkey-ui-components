// Consider having this implement Query.QueryColumn from @labkey/api
// commented out attributes are not used in app
import { Record } from 'immutable';
import { SchemaQuery } from './SchemaQuery';

export class QueryLookup extends Record({
    // server defaults
    displayColumn: undefined,
    isPublic: false,
    keyColumn: undefined,
    junctionLookup: undefined,
    multiValued: undefined,
    queryName: undefined,
    schemaName: undefined,
    table: undefined,
}) {
    displayColumn: string;
    isPublic: boolean;
    junctionLookup: string; // name of the column on the junction table that is also a lookup
    keyColumn: string;
    multiValued: string; // can be "junction", "value" or undefined. Server only support "junction" at this time
    // public: boolean; -- NOT ALLOWING DUE TO KEYWORD -- USE isPublic
    queryName: string;
    // schema: string; -- NOT ALLOWING -- USE schemaName
    schemaName: string;
    // table: string; -- NOT ALLOWING -- USE queryName
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
    // dimension: undefined,
    displayAsLookup: undefined,
    // excludeFromShifting: undefined,
    // ext: undefined,
    // facetingBehaviorType: undefined,
    fieldKey: undefined,
    fieldKeyArray: undefined,
    // fieldKeyPath: undefined,
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
    // measure: undefined,
    multiValue: false,
    // mvEnabled: undefined,
    name: undefined,
    // nullable: undefined,
    protected: undefined,
    rangeURI: undefined,
    readOnly: undefined,
    // recommendedVariable: undefined,
    required: undefined,
    // selectable: undefined,
    shortCaption: undefined,
    addToDisplayView: undefined,
    shownInDetailsView: undefined,
    shownInInsertView: undefined,
    shownInUpdateView: undefined,
    sortable: true,
    // sqlType: undefined,
    type: undefined,
    userEditable: undefined,
    // versionField: undefined,

    cell: undefined,
    columnRenderer: undefined,
    detailRenderer: undefined,
    inputRenderer: undefined,
    removeFromViews: false,
    sorts: undefined,
    units: undefined,
}) {
    align: string;
    // autoIncrement: boolean;
    // calculated: boolean;
    caption: string;
    conceptURI: string;
    // defaultScale: string;
    defaultValue: any;
    description: string;
    // dimension: boolean;
    displayAsLookup: boolean;
    // excludeFromShifting: boolean;
    // ext: any;
    // facetingBehaviorType: string;
    fieldKey: string;
    fieldKeyArray: string[];
    // fieldKeyPath: string;
    format: string;
    // friendlyType: string;
    hidden: boolean;
    inputType: string;
    // isAutoIncrement: boolean; // DUPLICATE
    // isHidden: boolean; // DUPLICATE
    isKeyField: boolean;
    // isMvEnabled: boolean;
    // isNullable: boolean;
    // isReadOnly: boolean;
    // isSelectable: boolean; // DUPLICATE
    // isUserEditable: boolean; // DUPLICATE
    // isVersionField: boolean;
    jsonType: string;
    // keyField: boolean;
    lookup: QueryLookup;
    // measure: boolean;
    multiValue: boolean;
    // mvEnabled: boolean;
    name: string;
    // nullable: boolean;
    'protected': boolean;
    rangeURI: string;
    readOnly: boolean;
    // recommendedVariable: boolean;
    required: boolean;
    // selectable: boolean;
    shortCaption: string;
    addToDisplayView: boolean;
    shownInDetailsView: boolean;
    shownInInsertView: boolean;
    shownInUpdateView: boolean;
    sortable: boolean;
    // sqlType: string;
    type: string;
    userEditable: boolean;
    // versionField: boolean;

    cell: Function;
    columnRenderer: string;
    detailRenderer: string;
    inputRenderer: string;
    sorts: '+' | '-';
    removeFromViews: boolean; // strips this column from all ViewInfo definitions
    units: string;

    static create(rawColumn): QueryColumn {
        if (rawColumn && rawColumn.lookup !== undefined) {
            return new QueryColumn(
                Object.assign({}, rawColumn, {
                    lookup: new QueryLookup(rawColumn.lookup),
                })
            );
        }

        return new QueryColumn(rawColumn);
    }

    static DATA_INPUTS = 'DataInputs';
    static MATERIAL_INPUTS = 'MaterialInputs';

    isExpInput(): boolean {
        return this.isDataInput() || this.isMaterialInput();
    }

    isDataInput(): boolean {
        return this.name && this.name.toLowerCase().indexOf(QueryColumn.DATA_INPUTS.toLowerCase()) !== -1;
    }

    isEditable() {
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
        /**
         * 35881: Ensure that a column is a valid lookup to one of the following
         * - exp.Materials
         * - samples.* (any sample set)
         */

        if (!this.isLookup()) {
            return false;
        }

        const lookupSQ = SchemaQuery.create(this.lookup.schemaName, this.lookup.queryName);
        // materialsSQ can't be a constant declared at the top of the file due to circular imports.
        const materialsSQ = SchemaQuery.create('exp', 'Materials');

        return materialsSQ.isEqual(lookupSQ) || lookupSQ.hasSchema('samples');
    }

    isMaterialInput(): boolean {
        return this.name && this.name.toLowerCase().indexOf(QueryColumn.MATERIAL_INPUTS.toLowerCase()) !== -1;
    }

    get isDetailColumn(): boolean {
        return !this.removeFromViews && this.shownInDetailsView === true;
    }

    get isUpdateColumn(): boolean {
        return (
            this.removeFromViews !== true &&
            this.shownInUpdateView === true &&
            this.userEditable === true &&
            this.fieldKeyArray.length === 1
        );
    }

    resolveFieldKey(): string {
        let fieldKey: string;

        if (this.isLookup()) {
            fieldKey = [this.name, this.lookup.displayColumn.replace(/\//g, '$S')].join('/');
        } else {
            fieldKey = this.name;
        }

        return fieldKey;
    }
}
