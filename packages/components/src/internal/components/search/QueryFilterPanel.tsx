/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { Filter, Query } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { naturalSortByProperty } from '../../../public/sort';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE } from '../../query/filter';

import { Tab, Tabs } from '../../Tabs';

import { FilterFacetedSelector, MAX_DISTINCT_FILTER_OPTIONS } from './FilterFacetedSelector';
import { ColumnFacets } from '../../../public/QueryModel/search/useColumnFacets';
import { FilterExpressionView } from './FilterExpressionView';
import { EntityFieldFilter } from './models';
import { isChooseValuesFilter } from './utils';
import { SAMPLE_PROPERTY_ALL_SAMPLE_TYPE } from './constants';
import { stringToHtmlId } from '../../util/utils';

type FacetingCost = 'cheap' | 'expensive' | 'unknown';

enum FieldFilterTabs {
    ChooseValues = 'ChooseValues',
    Filter = 'Filter',
}

const DEFAULT_VIEW_NAME = ''; // always use default view for selection, if none provided

export type OnFilterUpdate = (field: QueryColumn, newFilters: Filter.IFilter[], index: number) => void;

interface Props {
    allInQueryFilterLabel?: string;
    allowRelativeDateFilter?: boolean;
    altQueryName?: string;
    api?: ComponentsAPIWrapper;
    asRow?: boolean;
    // What the server already knows about each column, so an expensive value list can be skipped or served from cache
    columnFacets?: ColumnFacets;
    // Those facts are still loading, so a column with none yet may still turn out cheap
    // No facts response has arrived yet, so the grid's size is still unknown
    columnFactsLoading?: boolean;
    columnFactsPending?: boolean;
    emptyMsg?: string;
    // used for Sample Finder use case
    entityDataType?: EntityDataType;
    fieldKey?: string;
    fields?: QueryColumn[];
    filters: Record<string, EntityFieldFilter[]>;
    fullWidth?: boolean;
    hasAllValuesInQuery?: boolean;
    hasNotInQueryFilter?: boolean;
    hasNotInQueryFilterLabel?: string;
    isAncestor?: boolean;
    // the grid has too many rows to list a column's distinct values speculatively
    isLargeDataset?: boolean;
    metricFeatureArea?: string;
    onActiveFieldChange?: (field: QueryColumn) => void;
    onAllValuesInQueryChange?: (check: boolean) => void;
    // Called when the user opens the Choose values tab
    onChooseValues?: () => void;
    onFilterUpdate: OnFilterUpdate;
    onHasNoValueInQueryChange?: (check: boolean) => void;
    // Open this field on the Filter tab even when it would otherwise default to Choose values
    preferFilterTabFieldKey?: string;
    queryInfo: QueryInfo;
    selectDistinctOptions?: Partial<Query.SelectDistinctOptions>;
    skipDefaultViewCheck?: boolean;
    validFilterField?: (field: QueryColumn, queryInfo: QueryInfo, exprColumnsWithSubSelect?: string[]) => boolean;
    viewName?: string;
}

// Undefined where valuesWorthOpening is: the tab stays unchosen rather than being chosen twice
const chooseValuesIf = (worthOpening: boolean): FieldFilterTabs =>
    worthOpening === undefined ? undefined : worthOpening ? FieldFilterTabs.ChooseValues : FieldFilterTabs.Filter;

export const QueryFilterPanel: FC<Props> = memo(props => {
    const {
        allowRelativeDateFilter,
        hasNotInQueryFilter,
        hasAllValuesInQuery,
        asRow,
        api = getDefaultAPIWrapper(),
        columnFacets,
        columnFactsLoading,
        columnFactsPending,
        queryInfo,
        emptyMsg,
        skipDefaultViewCheck,
        validFilterField,
        entityDataType,
        fieldKey,
        filters,
        onFilterUpdate,
        metricFeatureArea,
        fullWidth,
        selectDistinctOptions,
        onHasNoValueInQueryChange,
        onAllValuesInQueryChange,
        hasNotInQueryFilterLabel,
        allInQueryFilterLabel,
        altQueryName,
        fields,
        isAncestor,
        isLargeDataset,
        onActiveFieldChange,
        onChooseValues,
        preferFilterTabFieldKey,
    } = props;
    const [queryFields, setQueryFields] = useState<QueryColumn[]>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [activeTab, setActiveTab] = useState<FieldFilterTabs>(undefined);

    const queryName = useMemo(() => queryInfo?.name.toLowerCase(), [queryInfo]);

    // for sample finder, assay data filters uses assay design name (part of schema key) instead of "data" (the query name) as query key
    const filterQueryKey = useMemo(() => {
        if (entityDataType && entityDataType.getInstanceDataType && queryInfo?.schemaQuery)
            return entityDataType.getInstanceDataType(queryInfo.schemaQuery, altQueryName)?.toLowerCase();
        return queryName;
    }, [queryInfo, entityDataType, queryName, altQueryName]);

    const viewName = useMemo(() => props.viewName ?? DEFAULT_VIEW_NAME, [props.viewName]);
    const allowFaceting = (col: QueryColumn): boolean => {
        return col?.isMultiChoice || (col?.allowFaceting() && col?.getDisplayFieldJsonType() === 'string'); // current plan is to only support facet for string fields, to reduce scope
    };

    const filterStatus = useMemo(() => {
        const status = {};
        if (!filters) return {};

        Object.keys(filters).forEach(parent => {
            const filterFields = filters[parent];
            filterFields.forEach(fieldFilter => {
                if (fieldFilter.filter.getFilterType() !== NOT_ANY_FILTER_TYPE) {
                    const key = parent.toLowerCase() + '-' + fieldFilter.fieldKey;
                    status[key] = true;
                }
            });
        });

        return status;
    }, [filters]);

    const hasFilters = useCallback(
        (field: QueryColumn) => {
            return filterStatus?.[filterQueryKey.toLowerCase() + '-' + field.resolveFieldKey()];
        },
        [filterStatus, filterQueryKey]
    );

    const getFacet = useCallback(
        (field: QueryColumn) =>
            columnFacets?.[field?.getDisplayFieldKey()?.toLowerCase()] ??
            columnFacets?.[field?.fieldKey?.toLowerCase()],
        [columnFacets]
    );

    // Faceting was asked for on this column, so its cost doesn't decide the tab
    const isFacetingForced = useCallback(
        (field: QueryColumn) => field.isMultiChoice || field.facetingBehaviorType === 'ALWAYS_ON',
        []
    );

    /**
     * Cached facts are read over the grid's own filters, so another field's filter leaves them describing rows the
     * user is no longer looking at. The values then can't be served from cache and the real query runs instead.
     */
    const hasOtherFieldFilters = useCallback(
        (field: QueryColumn) =>
            !!filters?.[filterQueryKey]?.some(fieldFilter => fieldFilter.fieldKey !== field?.getDisplayFieldKey()),
        [filters, filterQueryKey]
    );

    /**
     * What the server's facts say listing this column's values would cost. 'cheap' means the values are in hand;
     * 'expensive' means more were counted than the list can show; 'unknown' means the facts can't answer.
     */
    const getFacetingCost = useCallback(
        (field: QueryColumn): FacetingCost => {
            const facet = getFacet(field);
            if (facet?.values && !facet.truncated) return 'cheap';
            if (facet?.distinctCount > MAX_DISTINCT_FILTER_OPTIONS) return 'expensive';
            return 'unknown';
        },
        [getFacet]
    );

    /**
     * Whether opening this column's value list is worth what it costs, which doesn't depend on its own filters.
     * Undefined while the answer can still change: the first facts response reports the table's size, so deciding
     * before it lands would read a large grid as small and move the tab under the user a moment later.
     */
    const valuesWorthOpening = useCallback(
        (field: QueryColumn): boolean => {
            if (isFacetingForced(field)) return true;
            const cost = getFacetingCost(field);
            // Cheap only counts while the cached list can actually be used; otherwise the real query runs
            if (cost === 'cheap' && !hasOtherFieldFilters(field)) return true;
            if (cost === 'unknown' && columnFactsLoading) return undefined;
            if (isLargeDataset) return false;
            // Not large, so nothing says the list is expensive yet; open the tab and let the selector wait
            return cost !== 'expensive';
        },
        [isFacetingForced, getFacetingCost, hasOtherFieldFilters, columnFactsLoading, isLargeDataset]
    );

    const getDefaultActiveTab = useCallback(
        (field: QueryColumn) => {
            if (field.isMultiChoice) return FieldFilterTabs.ChooseValues;

            if (!allowFaceting(field) || field.getDisplayFieldKey() === preferFilterTabFieldKey) {
                return FieldFilterTabs.Filter;
            }
            if (!hasFilters(field)) {
                return chooseValuesIf(valuesWorthOpening(field));
            }
            const currentFieldFilters = filters[filterQueryKey].filter(
                filterField => filterField.fieldKey === field.resolveFieldKey()
            );
            if (currentFieldFilters.length > 1) {
                return FieldFilterTabs.Filter;
            }
            // An existing choose-values filter is edited on that tab, but only where opening it is worth the cost
            if (!isChooseValuesFilter(currentFieldFilters[0].filter)) return FieldFilterTabs.Filter;
            return chooseValuesIf(valuesWorthOpening(field));
        },
        [hasFilters, filters, filterQueryKey, preferFilterTabFieldKey, valuesWorthOpening]
    );

    useEffect(() => {
        setQueryFields(undefined);
        setActiveField(undefined);
        if (!queryInfo) return;

        let validFields: QueryColumn[];
        if (fields) validFields = fields;
        else {
            const qFields = skipDefaultViewCheck
                ? queryInfo.getAllColumns(viewName)
                : queryInfo.getDisplayColumns(viewName);
            validFields = qFields.filter(
                field =>
                    field.filterable &&
                    (!validFilterField || validFilterField(field, queryInfo, entityDataType?.exprColumnsWithSubSelect))
            );
        }

        // Issue 53983: Sort fields by caption
        if (validFields) {
            validFields = validFields.sort(naturalSortByProperty('caption'));
        }

        setQueryFields(validFields);
        if (fieldKey) {
            const field = validFields.find(f => f.getDisplayFieldKey() === fieldKey);
            setActiveField(field);
        }
    }, [
        queryInfo,
        skipDefaultViewCheck,
        validFilterField,
        entityDataType?.exprColumnsWithSubSelect,
        fieldKey,
        viewName,
        fields,
    ]);

    /**
     * On a large grid neither tab can be chosen until the facts are in: the values tab would run the scan this
     * avoids, and the filter tab would be wrong for a column whose values are already cached. Waiting leaves the
     * panel briefly indeterminate, which is better than deciding twice and moving the tab under the user.
     */
    const awaitingTabDecision = !!activeField && getDefaultActiveTab(activeField) === undefined;

    useEffect(() => {
        if (activeField && !awaitingTabDecision) setActiveTab(getDefaultActiveTab(activeField));
        // getDefaultActiveTab is left out so the tab is decided once per field, not revised as its inputs settle
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeField, awaitingTabDecision]);

    const activeFieldKey = useMemo(() => {
        return activeField?.getDisplayFieldKey();
    }, [activeField]);

    const currentFieldFilters = useMemo((): EntityFieldFilter[] => {
        if (!filters || !activeField) return null;

        const activeQueryFilters: EntityFieldFilter[] = filters[filterQueryKey];
        return activeQueryFilters?.filter(filter => filter.fieldKey === activeFieldKey);
    }, [activeField, filterQueryKey, filters, activeFieldKey]);

    const fieldDistinctValueFilters = useMemo(() => {
        if (!filters || !filterQueryKey || !activeField) return null;

        // Issue 45135: include any model filters (baseFilters or queryInfo filters)
        const valueFilters = selectDistinctOptions?.filterArray ? [...selectDistinctOptions.filterArray] : [];

        // use active filters to filter distinct values, but exclude filters on current field
        filters?.[filterQueryKey]?.forEach(field => {
            if (field.fieldKey !== activeFieldKey) {
                let filter = field.filter;
                // convert ancestor matches all to IN filter type for distinct value selection
                if (filter.getFilterType().getURLSuffix() === ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE.getURLSuffix())
                    filter = Filter.create(filter.getColumnName(), filter.getValue(), Filter.Types.IN);
                valueFilters.push(filter);
            }
        });

        return valueFilters;
    }, [filters, filterQueryKey, activeField, activeFieldKey, selectDistinctOptions]);

    const onFieldClick = useCallback(
        (queryColumn: QueryColumn) => {
            setActiveField(queryColumn);
            onActiveFieldChange?.(queryColumn);
        },
        [onActiveFieldChange]
    );

    const onTabChange = useCallback(
        (tabKey: any) => {
            setActiveTab(tabKey);

            if (tabKey === FieldFilterTabs.ChooseValues) {
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'goToChooseValuesTab');
                onChooseValues?.();
            }
        },
        [api, metricFeatureArea, onChooseValues]
    );

    const fieldFilters = useMemo(() => {
        return currentFieldFilters?.map(filter => filter.filter);
    }, [currentFieldFilters]);

    const includeAllAncestorFilter = useMemo(() => {
        return isAncestor && activeField?.fieldKey.toLowerCase() === 'name';
    }, [isAncestor, activeField]);

    const onFieldFilterUpdate = useCallback(
        (newFilters: Filter.IFilter[], index = 0) => {
            onFilterUpdate(activeField, newFilters, index);
        },
        [onFilterUpdate, activeField]
    );

    // Cached facts are scoped to the grid's base filters, so they can't answer for a grid filtered on another field
    const factsApply = !hasOtherFieldFilters(activeField);

    const activeFacet = useMemo(
        () => (factsApply ? getFacet(activeField) : undefined),
        [activeField, factsApply, getFacet]
    );
    // A truncated list is missing values, so it can't stand in for the query
    const rawFacetValues = activeFacet?.truncated ? undefined : activeFacet?.values;
    // Cached lists never carry blanks, so the facts say whether to offer one. A copy: the array is the cache's own.
    const facetValues = useMemo(
        () => (rawFacetValues && activeFacet.hasBlank ? [...rawFacetValues, null] : rawFacetValues),
        [activeFacet, rawFacetValues]
    );

    const facetSelectDistinctOptions = useMemo(() => {
        return {
            ...selectDistinctOptions,
            column: activeFieldKey,
            schemaName: queryInfo?.schemaName,
            queryName,
            viewName,
            filterArray: fieldDistinctValueFilters,
        };
    }, [selectDistinctOptions, activeFieldKey, queryInfo, fieldDistinctValueFilters, queryName, viewName]);

    const fieldsClassName = `col-xs-${fullWidth ? 12 : 6} col-sm-${
        fullWidth ? 4 : 3
    } field-modal__col filter-modal__col_fields`;
    const valuesClassName = `col-xs-12 col-sm-${fullWidth ? 8 : 6} field-modal__col filter-modal__col_filter_exp`;

    const body = (
        <>
            <div className={fieldsClassName}>
                <div className="field-modal__col-title">Fields</div>
                {!queryName && emptyMsg && <div className="field-modal__empty-msg">{emptyMsg}</div>}
                {queryName && (
                    <div className="list-group field-modal__col-content filter-modal__fields-col-content">
                        {!queryFields && <LoadingSpinner wrapperClassName="loading-spinner" />}
                        {entityDataType?.supportAllValueInQuery &&
                            altQueryName !== SAMPLE_PROPERTY_ALL_SAMPLE_TYPE.query && (
                                <div className="form-check list-group-item">
                                    <input
                                        aria-labelledby={stringToHtmlId('all-data-label-' + queryName)}
                                        checked={hasAllValuesInQuery}
                                        className="form-check-input filter-faceted__checkbox"
                                        name="field-value-allvalues-check"
                                        onChange={event => onAllValuesInQueryChange(event.target.checked)}
                                        type="checkbox"
                                    />
                                    <div
                                        className="filter-modal__fields-col-any-msg"
                                        id={stringToHtmlId('all-data-label-' + queryName)}
                                    >
                                        {allInQueryFilterLabel ?? 'All data'}
                                    </div>
                                </div>
                            )}
                        {entityDataType?.supportHasNoValueInQuery && (
                            <div className="form-check list-group-item">
                                <input
                                    aria-labelledby={'without-data-label-' + queryName}
                                    checked={hasNotInQueryFilter}
                                    className="form-check-input filter-faceted__checkbox"
                                    name="field-value-nodata-check"
                                    onChange={event => onHasNoValueInQueryChange(event.target.checked)}
                                    type="checkbox"
                                />
                                <div
                                    className="filter-modal__fields-col-nodata-msg"
                                    id={'without-data-label-' + queryName}
                                >
                                    {hasNotInQueryFilterLabel ?? 'Without data from this type'}
                                </div>
                            </div>
                        )}
                        <div
                            className={classNames({
                                'field-modal__col-content-disabled': hasNotInQueryFilter,
                            })}
                        >
                            {queryFields?.map((field, index) => {
                                const { caption } = field;
                                const currFieldKey = field.getDisplayFieldKey();
                                return (
                                    <ChoicesListItem
                                        active={currFieldKey === activeFieldKey}
                                        componentRight={
                                            hasFilters(field) && <span className="pull-right field-modal__field_dot" />
                                        }
                                        disabled={hasNotInQueryFilter}
                                        index={index}
                                        key={field.fieldKeyPath}
                                        label={<span data-fieldkey={field.fieldKeyPath}>{caption}</span>}
                                        onSelect={() => onFieldClick(field)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            <div className={valuesClassName}>
                <div className="field-modal__col-title">Values</div>
                {queryName && !activeField && <div className="field-modal__empty-msg">Select a field.</div>}
                {queryName && activeField && (
                    <div
                        className={classNames('field-modal__col-content field-modal__values', {
                            'field-modal__col-content-disabled': hasNotInQueryFilter,
                        })}
                    >
                        {awaitingTabDecision && <LoadingSpinner wrapperClassName="loading-spinner" />}
                        {!awaitingTabDecision && (
                            <Tabs
                                activeKey={activeTab}
                                className="field-modal__tabs content-tabs"
                                onSelect={onTabChange}
                            >
                                {!activeField.isMultiChoice && (
                                    <Tab eventKey={FieldFilterTabs.Filter} title="Filter">
                                        <div className="field-modal__col-sub-title">
                                            Find values for {activeField.caption}
                                        </div>
                                        {activeTab === FieldFilterTabs.Filter && (
                                            <FilterExpressionView
                                                allowRelativeDateFilter={allowRelativeDateFilter}
                                                disabled={hasNotInQueryFilter}
                                                field={activeField}
                                                fieldFilters={fieldFilters}
                                                includeAllAncestorFilter={includeAllAncestorFilter}
                                                key={activeFieldKey}
                                                onFieldFilterUpdate={onFieldFilterUpdate}
                                            />
                                        )}
                                    </Tab>
                                )}
                                {allowFaceting(activeField) && (
                                    <Tab eventKey={FieldFilterTabs.ChooseValues} title="Choose values">
                                        <div className="field-modal__col-sub-title">
                                            Find values for {activeField.caption}
                                        </div>
                                        {activeTab === FieldFilterTabs.ChooseValues && (
                                            <FilterFacetedSelector
                                                api={api}
                                                awaitingFacts={columnFactsPending}
                                                canBeBlank={!activeField?.required && !activeField.nameExpression}
                                                disabled={hasNotInQueryFilter}
                                                facetValues={facetValues}
                                                field={activeField}
                                                fieldFilters={fieldFilters}
                                                fieldKey={activeFieldKey}
                                                key={activeFieldKey}
                                                onFieldFilterUpdate={onFieldFilterUpdate}
                                                selectDistinctOptions={facetSelectDistinctOptions}
                                            />
                                        )}
                                    </Tab>
                                )}
                            </Tabs>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    if (asRow) {
        return <div className="row field-modal__container">{body}</div>;
    } else {
        return body;
    }
});

QueryFilterPanel.displayName = 'QueryFilterPanel';
