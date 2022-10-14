import React, { FC, memo, useCallback, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';

import { AppURL } from '../internal/url/AppURL';

import { FIND_SAMPLES_BY_FILTER_KEY } from '../internal/app/constants';

import { formatDateTime } from '../internal/util/Date';

import { EntityDataType } from '../internal/components/entities/models';

import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';

import { useAppContext } from '../internal/AppContext';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { getSampleFinderLocalStorageKey } from './utils';
import { isValidFilterFieldSampleFinder, searchFiltersToJson } from '../internal/components/search/utils';
import { FieldFilter, FilterProps } from '../internal/components/search/models';
import { SAMPLE_FINDER_SESSION_PREFIX } from '../internal/components/search/constants';

const DISABLED_FIND_DERIVATIVES_MSG =
    'Unable to find derivative samples using search filters or filters on multi-valued lookup fields';

export const getFieldFilter = (model: QueryModel, filter: Filter.IFilter): FieldFilter => {
    const colName = filter.getColumnName();
    const column = model.getColumn(colName);

    return {
        fieldKey: colName,
        fieldCaption: column?.caption ?? colName,
        filter,
        jsonType: column.isLookup() ? column.displayFieldJsonType : column?.jsonType ?? 'string',
    } as FieldFilter;
};

export const getSessionSearchFilterProps = (
    entityDataType: EntityDataType,
    model: QueryModel,
    filters: Filter.IFilter[],
    baseEntityDataType?: EntityDataType,
    baseModel?: QueryModel,
    baseFilter?: Filter.IFilter[]
): FilterProps[] => {
    let fieldFilters = [];
    // optionally include baseFilter when passed without a baseModel (i.e. apply to the same schemaQuery as the other filters)
    if (baseFilter && !baseModel) {
        fieldFilters = fieldFilters.concat(baseFilter.map(filter => getFieldFilter(model, filter)));
    }
    // always include viewFilters and user defined filters (filterArray)
    fieldFilters = fieldFilters.concat(filters.map(filter => getFieldFilter(model, filter)));

    const filterProps = [];
    if (baseModel && baseFilter) {
        filterProps.push({
            schemaQuery: baseModel.schemaQuery,
            filterArray: baseFilter.map(filter => getFieldFilter(baseModel, filter)),
            entityDataType: baseEntityDataType,
            dataTypeDisplayName: baseModel.title ?? baseModel.queryInfo.title ?? baseModel.queryName,
        });
    }
    filterProps.push({
        schemaQuery: model.schemaQuery,
        filterArray: fieldFilters,
        entityDataType,
        dataTypeDisplayName: model.title ?? model.queryInfo.title ?? model.queryName,
    });

    return filterProps;
};

interface Props {
    asSubMenu?: boolean;
    baseEntityDataType?: EntityDataType;
    baseFilter?: Filter.IFilter[];
    baseModel?: QueryModel;
    entityDataType: EntityDataType;
    metricFeatureArea?: string;
    model: QueryModel;
}

export const FindDerivativesMenuItem: FC<Props> = memo(props => {
    const { baseEntityDataType, baseModel, baseFilter, model, entityDataType, metricFeatureArea } = props;
    const { api } = useAppContext();

    const viewAndUserFilters = useMemo(
        () => (!model.queryInfo ? [] : [].concat(model.viewFilters).concat(model.filterArray)),
        [model]
    );
    const invalidFilterNames = useMemo(
        () =>
            viewAndUserFilters
                .map(filter => {
                    const colName = filter.getColumnName();
                    const column = model.getColumn(colName);
                    if (!column) {
                        return colName === '*' ? 'Search Filter' : 'Unknown Field';
                    }

                    return !isValidFilterFieldSampleFinder(column, model.queryInfo) ? column.caption : undefined;
                })
                .filter(caption => caption !== undefined)
                .join(', '),
        [model, viewAndUserFilters]
    );

    const onClick = useCallback(() => {
        const currentTimestamp = new Date();
        const sessionViewName = SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(currentTimestamp);
        const filterProps = getSessionSearchFilterProps(
            entityDataType,
            model,
            viewAndUserFilters,
            baseEntityDataType,
            baseModel,
            baseFilter
        );

        sessionStorage.setItem(getSampleFinderLocalStorageKey(), searchFiltersToJson(filterProps, 0, currentTimestamp));
        api.query.incrementClientSideMetricCount(metricFeatureArea, 'sampleFinderFindDerivatives');

        window.location.href = AppURL.create('search', FIND_SAMPLES_BY_FILTER_KEY)
            .addParam('view', sessionViewName)
            .toHref();
    }, [api.query, baseFilter, baseModel, entityDataType, metricFeatureArea, model, viewAndUserFilters]);

    if (!model.queryInfo) return null;

    return (
        <DisableableMenuItem
            operationPermitted={!invalidFilterNames}
            disabledMessage={DISABLED_FIND_DERIVATIVES_MSG + ' (' + invalidFilterNames + ').'}
            onClick={onClick}
            placement="right"
        >
            Find Derivatives in Sample Finder
        </DisableableMenuItem>
    );
});

export const FindDerivativesButton: FC<Props> = memo(props => {
    const items = <FindDerivativesMenuItem {...props} />;
    return <ResponsiveMenuButton id="sample-reports-menu" items={items} text="Reports" asSubMenu={props.asSubMenu} />;
});
