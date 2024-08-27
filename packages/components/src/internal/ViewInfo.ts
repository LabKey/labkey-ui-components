import { Filter } from '@labkey/api';
import { IQueryColumn } from '../public/QueryColumn';

import { QuerySort, QuerySortJson } from '../public/QuerySort';
import { QueryInfo } from '../public/QueryInfo';

function getFiltersFromView(filters: ViewInfoFilter[]): Filter.IFilter[] {
    if (filters) {
        return filters.map(filter =>
            Filter.create(filter.fieldKey, filter.value, Filter.getFilterTypeForURLSuffix(filter.op))
        );
    }

    return [];
}

function getSortsFromView(sorts: QuerySortJson[]): QuerySort[] {
    if (sorts) {
        return sorts.map(sort => new QuerySort(sort));
    }

    return [];
}

interface ViewInfoColumn {
    fieldKey: string;
    key?: string;
    name?: string;
    title?: string;
}

interface ViewInfoFilter {
    fieldKey: string;
    op: string;
    value: string | number | boolean;
}

export interface ViewInfoJson {
    // aggregates: any[];
    // analyticsProviders: any[];
    columns?: ViewInfoColumn[];
    default?: boolean;
    // deletable: boolean;
    // editable: boolean;
    fields?: IQueryColumn[];
    filter?: ViewInfoFilter[];
    hidden?: boolean;
    inherit?: boolean;
    label?: string;
    name?: string;
    revertable?: boolean;
    savable?: boolean;
    saved?: boolean;
    session?: boolean;
    shared?: boolean;
    sort?: QuerySortJson[];
}

const VIEW_INFO_DEFAULTS = {
    columns: [],
    filters: [],
    hidden: false,
    inherit: false,
    isDefault: false,
    label: undefined,
    name: undefined,
    revertable: false,
    savable: false,
    saved: false,
    session: false,
    shared: false,
    sorts: [],
};

// commented out attributes are not used in app
export class ViewInfo {
    // declare aggregates: any[];
    // declare analyticsProviders: any[];
    declare columns: ViewInfoColumn[];
    // declare deletable: boolean;
    // declare editable: boolean;
    declare filters: Filter.IFilter[];
    declare hidden: boolean;
    declare inherit: boolean;
    declare isDefault: boolean; // 'default' is a JavaScript keyword
    declare label: string;
    declare name: string;
    declare revertable: boolean;
    declare savable: boolean;
    declare saved: boolean;
    declare session: boolean;
    declare shared: boolean;
    declare sorts: QuerySort[];

    static DEFAULT_NAME = '~~DEFAULT~~';
    static DETAIL_NAME = '~~DETAILS~~';
    static UPDATE_NAME = '~~UPDATE~~';
    static SAMPLE_FINDER_VIEW_NAME = '~~samplefinder~~';
    static IDENTIFYING_FIELDS_VIEW_NAME = '~~identifyingfields~~';
    // TODO seems like this should not be in the generic model, but we'll need a good way
    //  to define the override detail name.
    static BIO_DETAIL_NAME = 'BiologicsDetails';

    constructor(partial: Partial<ViewInfo>) {
        Object.assign(this, VIEW_INFO_DEFAULTS, partial);
    }

    static fromJson(json: ViewInfoJson) {
        const { columns, filter, label, name, sort, ...rest } = json;
        const isDefault = rest.default === true;
        delete rest.default;
        const label_ = isDefault ? 'Default' : label;
        const name_ = isDefault || name === undefined || name === '' ? ViewInfo.DEFAULT_NAME : name;

        return new ViewInfo({
            columns: columns !== undefined ? [...columns] : [],
            filters: getFiltersFromView(filter),
            isDefault,
            label: label_,
            name: name_,
            sorts: getSortsFromView(sort),
            ...rest,
        });
    }

    static serialize(viewInfo: ViewInfo): ViewInfoJson {
        const { columns, filters, isDefault, sorts, ...rest } = viewInfo;
        const json = rest as unknown as ViewInfoJson;

        json.columns = [...columns];
        json.default = isDefault;

        if (json.name === this.DEFAULT_NAME) {
            json.name = '';
        }

        json.filter = filters.map(filter => ({
            fieldKey: filter.getColumnName(),
            value: filter.getURLParameterValue(),
            op: filter.getFilterType().getURLSuffix(),
        }));

        json.sort = sorts.map(sort => ({
            fieldKey: sort.fieldKey,
            dir: sort.dir,
        }));

        return json;
    }

    get isVisible(): boolean {
        // Issue 42628: Hide Biologics details view override in view menu
        return (
            !this.isDefault && !this.hidden && this.name.indexOf('~~') !== 0 && this.name !== ViewInfo.BIO_DETAIL_NAME
        );
    }

    get isSaved(): boolean {
        return this.saved === true;
    }

    get isSystemView(): boolean {
        const lcName = this.name?.toLowerCase();
        return (
            lcName === ViewInfo.DEFAULT_NAME.toLowerCase() ||
            lcName === ViewInfo.DETAIL_NAME.toLowerCase() ||
            lcName === ViewInfo.UPDATE_NAME.toLowerCase()
        );
    }

    get modifiers(): string[] {
        const modifiers = [];
        if (this.session) {
            modifiers.push('edited');
        } else {
            if (this.inherit) modifiers.push('inherited');
            if (this.shared) modifiers.push('shared');
        }
        return modifiers;
    }

    addSystemViewColumns(queryInfo: QueryInfo) {
        if (this.isDefault && !this.session) {
            const columns = [...this.columns];
            const columnFieldKeys = columns.map(col => col.fieldKey.toLowerCase());
            const disabledSysFields = Array.from(queryInfo.disabledSystemFields ?? []).map(field =>
                field.toLowerCase()
            );

            queryInfo.columns.forEach(queryCol => {
                const fieldKey = queryCol.fieldKey?.toLowerCase();
                if (
                    fieldKey &&
                    queryCol.addToSystemView &&
                    columnFieldKeys.indexOf(fieldKey) === -1 &&
                    disabledSysFields.indexOf(fieldKey) === -1
                ) {
                    columns.push({
                        fieldKey: queryCol.fieldKey,
                        key: queryCol.fieldKey,
                        name: queryCol.name,
                        title: queryCol.caption || queryCol.name,
                    });
                }
            });
            return this.mutate({ columns });
        }
        return this;
    }

    mutate(updates: Partial<ViewInfo>) {
        return new ViewInfo({
            ...this,
            ...updates,
        });
    }
}

