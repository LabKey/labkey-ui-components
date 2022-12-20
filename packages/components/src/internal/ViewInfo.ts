import { List, Record } from 'immutable';
import { Filter } from '@labkey/api';
import { QuerySort } from '../public/QuerySort';
import { QueryInfo } from '../public/QueryInfo';

function getFiltersFromView(rawViewInfo): List<Filter.IFilter> {
    const filters = List<Filter.IFilter>().asMutable();

    // notice, in the raw version it is raw.filter (no s)
    if (rawViewInfo && rawViewInfo.filter) {
        const rawFilters: Array<{
            fieldKey: string;
            op: string;
            value: any;
        }> = rawViewInfo.filter;

        for (let i = 0; i < rawFilters.length; i++) {
            const filter = rawFilters[i];
            filters.push(Filter.create(filter.fieldKey, filter.value, Filter.getFilterTypeForURLSuffix(filter.op)));
        }
    }

    return filters.asImmutable();
}

function getSortsFromView(rawViewInfo): List<QuerySort> {
    if (rawViewInfo && rawViewInfo.sort && rawViewInfo.sort.length > 0) {
        const sorts = List<QuerySort>().asMutable();
        rawViewInfo.sort.forEach(sort => {
            sorts.push(new QuerySort(sort));
        });
        return sorts.asImmutable();
    }

    return List<QuerySort>();
}

interface IViewInfoColumn {
    fieldKey: string;
    key: string;
    name: string;
    title?: string;
}

// commented out attributes are not used in app
export class ViewInfo extends Record({
    // aggregates: List(),
    // analyticsProviders: List(),
    columns: List<IViewInfoColumn>(),
    // deletable: false,
    // editable: false,
    filters: List<Filter.IFilter>(),
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
    sorts: List<QuerySort>(),
}) {
    // declare aggregates: List<any>;
    // declare analyticsProviders: List<any>;
    declare columns: List<IViewInfoColumn>;
    // declare deletable: boolean;
    // declare editable: boolean;
    declare filters: List<Filter.IFilter>;
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
    declare sorts: List<QuerySort>;

    static DEFAULT_NAME = '~~DEFAULT~~';
    static DETAIL_NAME = '~~DETAILS~~';
    static UPDATE_NAME = '~~UPDATE~~';
    // TODO seems like this should not be in the generic model, but we'll need a good way
    //  to define the override detail name.
    static BIO_DETAIL_NAME = 'BiologicsDetails';

    static create(rawViewInfo): ViewInfo {
        // prepare name and isDefault
        let label = rawViewInfo.label;
        let name = '';
        const isDefault = rawViewInfo['default'] === true;
        if (isDefault) {
            name = ViewInfo.DEFAULT_NAME;
            label = 'Default';
        } else {
            name = rawViewInfo.name;
        }

        return new ViewInfo(
            Object.assign({}, rawViewInfo, {
                columns: List<IViewInfoColumn>(rawViewInfo.columns),
                filters: getFiltersFromView(rawViewInfo),
                isDefault,
                label,
                name,
                sorts: getSortsFromView(rawViewInfo),
            })
        );
    }

    static serialize(viewInfo: ViewInfo): any {
        const json = viewInfo.toJS();

        if (json.name === this.DEFAULT_NAME) {
            json.name = '';
        }

        json.filter = viewInfo.filters.map(filter => {
            return {
                fieldKey: filter.getColumnName(),
                value: filter.getURLParameterValue(),
                op: filter.getFilterType().getURLSuffix(),
            };
        });
        delete json.filters;

        json.sort = viewInfo.sorts.map(sort => {
            return {
                fieldKey: sort.fieldKey,
                dir: sort.dir,
            };
        });
        delete json.sorts;

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
            modifiers.push('edited')
        }
        else {
            if (this.inherit)
                modifiers.push('inherited');
            if (this.shared)
                modifiers.push('shared');
        }
        return modifiers;
    }

    addSystemViewColumns(queryInfo: QueryInfo) {
        if (this.isDefault && !this.session) {
            let columns = this.columns;
            const columnFieldKeys = this.columns.map(col => {
                return col.fieldKey.toLowerCase()
            }).toArray();
            queryInfo.columns.forEach(queryCol => {
                if (queryCol.fieldKey && queryCol.addToSystemView && columnFieldKeys.indexOf(queryCol.fieldKey.toLowerCase()) === -1) {
                    columns = columns.push({
                        fieldKey: queryCol.fieldKey,
                        key: queryCol.fieldKey,
                        name: queryCol.name,
                        title: queryCol.caption || queryCol.name,
                    });
                }
            });
            return this.mutate({columns});
        }
        return this;
    }

    mutate(updates: Partial<ViewInfo>) {
        return new ViewInfo({
            ...this.toJS(),
            ...updates,
        });
    }
}
