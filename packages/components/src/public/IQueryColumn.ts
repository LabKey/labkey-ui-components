// Note: it is necessary to put IQueryColumn in its own file in order to get rid of circular dependencies between
// ViewInfo and QueryColumn via the schemas.ts

export interface IQueryColumn {
    addToSystemView: boolean;
    align: string;
    // autoIncrement: boolean;
    // calculated: boolean;
    caption: string;
    conceptSubtree: string;
    conceptURI: string;
    defaultValue: any;
    derivationDataScope: string;
    description: string;
    dimension: boolean;
    displayAsLookup: boolean;
    // defaultScale: string;
    displayField?: string;
    displayFieldJsonType?: string;
    displayFieldSqlType?: string;
    // excludeFromShifting: boolean;
    // ext: any;
    facetingBehaviorType: string;
    fieldKey: string;
    fieldKeyArray: string[];
    fieldKeyPath: string;
    filterable: boolean;
    format: string;
    // friendlyType: string;
    hasSortKey: boolean;
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
    lookup: Record<string, any>;
    measure: boolean;
    multiValue: boolean;
    // mvEnabled: boolean;
    name: string;
    nameExpression: string;
    // nullable: boolean;
    phiProtected: boolean;
    protected: boolean;
    rangeURI: string;
    readOnly: boolean;
    removeFromViewCustomization: boolean;
    removeFromViews: boolean; // strips this column from all ViewInfo definitions
    // recommendedVariable: boolean;
    required: boolean;
    scale: number;
    selectable: boolean;
    shortCaption: string;
    shownInDetailsView: boolean;
    shownInInsertView: boolean;
    shownInLookupView: boolean;
    shownInUpdateView: boolean;
    sortable: boolean;
    // versionField: boolean;
    sorts: '+' | '-';
    sourceOntology: string;
    // sqlType: string;
    tableCell: boolean;
    type: string;
    units: string;
    userEditable: boolean;
    validValues: string[];
    width: number;
}
