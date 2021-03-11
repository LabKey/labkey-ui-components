import { List, Record } from 'immutable';
import { Filter } from '@labkey/api';

import { QuerySort } from '..';

function getFiltersFromView(rawViewInfo): List<Filter.IFilter> {
    const filters = List<Filter.IFilter>().asMutable();

    // notice, in the raw version it is raw.filter (no s)
    if (rawViewInfo && rawViewInfo.filter) {
        const rawFilters: Array<{
            fieldKey: string;
            value: any;
            op: string;
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
    // inherit: false,
    isDefault: false,
    label: undefined,
    name: undefined,
    // revertable: false,
    // savable: false,
    // session: false,
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
    // declare inherit: boolean;
    declare isDefault: boolean; // 'default' is a JavaScript keyword
    declare label: string;
    declare name: string;
    // declare revertable: boolean;
    // declare savable: boolean;
    // declare session: boolean;
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
}
