import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Nav, NavItem, Tab } from 'react-bootstrap';
import { fromJS, List } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { resolveErrorMessage } from '../../util/messaging';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { FilterFacetedSelector } from './FilterFacetedSelector';
import { FilterExpressionView } from './FilterExpressionView';
import { FieldFilter } from './models';

enum EntityFieldFilterTabs {
    Filter = 'Filter',
    ChooseValues = 'Choose values',
}

const DEFAULT_VIEW_NAME = ''; // always use default view for selection, if none provided
const CHOOSE_VALUES_TAB_KEY = 'Choose values';

interface Props {
    api?: ComponentsAPIWrapper;
    emptyMsg?: string;
    entityDataType?: EntityDataType; // used for Sample Finder use case
    fieldKey?: string;
    filters: { [key: string]: FieldFilter[] };
    fullWidth?: boolean;
    metricFeatureArea?: string;
    onFilterUpdate: (field: QueryColumn, newFilter: Filter.IFilter) => void;
    queryInfo: QueryInfo;
    selectDistinctOptions?: Partial<Query.SelectDistinctOptions>;
    skipDefaultViewCheck?: boolean;
    validFilterField?: (field: QueryColumn, queryInfo: QueryInfo, exprColumnsWithSubSelect?: string[]) => boolean;
    viewName?: string;
}

export const QueryFilterPanel: FC<Props> = memo(props => {
    const {
        api,
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
    } = props;
    const [queryFields, setQueryFields] = useState<List<QueryColumn>>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [activeTab, setActiveTab] = useState<EntityFieldFilterTabs>(undefined);

    const queryName = useMemo(() => queryInfo?.name.toLowerCase(), [queryInfo]);
    const viewName = useMemo(() => props.viewName ?? DEFAULT_VIEW_NAME, [props.viewName]);
    const allowFaceting = (col: QueryColumn): boolean => {
        return col?.allowFaceting() && col?.getDisplayFieldJsonType() === 'string'; // current plan is to only support facet for string fields, to reduce scope
    };

    useEffect(() => {
        setQueryFields(undefined);
        setActiveField(undefined);
        if (!queryInfo) return;

        const fields = skipDefaultViewCheck ? queryInfo.getAllColumns(viewName) : queryInfo.getDisplayColumns(viewName);
        setQueryFields(
            fromJS(
                fields.filter(
                    field =>
                        !validFilterField ||
                        validFilterField(field, queryInfo, entityDataType?.exprColumnsWithSubSelect)
                )
            )
        );
        if (fieldKey) {
            const field = fields.find(f => f.getDisplayFieldKey() === fieldKey);
            setActiveField(field);
            setActiveTab(allowFaceting(field) ? EntityFieldFilterTabs.ChooseValues : EntityFieldFilterTabs.Filter);
        }
    }, [api, queryInfo, skipDefaultViewCheck, validFilterField, entityDataType?.exprColumnsWithSubSelect, fieldKey]);

    const activeFieldKey = useMemo(() => {
        return activeField?.getDisplayFieldKey();
    }, [activeField]);

    const currentFieldFilter = useMemo(() => {
        if (!filters || !activeField) return null;

        const activeQueryFilters: FieldFilter[] = filters[queryName];
        return activeQueryFilters?.find(filter => filter.fieldKey === activeFieldKey);
    }, [activeField, queryName, filters, activeFieldKey]);

    const filterStatus = useMemo(() => {
        const status = {};
        if (!filters) return {};

        Object.keys(filters).forEach(query => {
            const filterFields = filters[query];
            filterFields.forEach(field => {
                if (field.filter.getFilterType() !== NOT_ANY_FILTER_TYPE) {
                    const key = query + '-' + field.fieldKey;
                    status[key] = true;
                }
            });
        });

        return status;
    }, [filters]);

    const fieldDistinctValueFilters = useMemo(() => {
        if (!filters || !queryName || !activeField) return null;

        const valueFilters = [];

        // use active filters to filter distinct values, but exclude filters on current field
        filters?.[queryName]?.forEach(field => {
            if (field.fieldKey !== activeFieldKey) valueFilters.push(field.filter);
        });

        return valueFilters;
    }, [filters, queryName, activeField, activeFieldKey]);

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        setActiveField(queryColumn);
        setActiveTab(allowFaceting(queryColumn) ? EntityFieldFilterTabs.ChooseValues : EntityFieldFilterTabs.Filter);
    }, []);

    const onTabChange = useCallback(
        (tabKey: any) => {
            setActiveTab(tabKey);

            if (tabKey === CHOOSE_VALUES_TAB_KEY) {
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'goToChooseValuesTab');
            }
        },
        [api, metricFeatureArea]
    );

    return (
        <>
            <Col xs={fullWidth ? 12 : 6} sm={fullWidth ? 4 : 3} className="filter-modal__col filter-modal__col_fields">
                <div className="filter-modal__col-title">Fields</div>
                {!queryName && emptyMsg && <div className="filter-modal__empty-msg">{emptyMsg}</div>}
                {queryName && (
                    <div className="list-group filter-modal__col-content filter-modal__fields-col-content">
                        {!queryFields && <LoadingSpinner wrapperClassName="loading-spinner" />}
                        {queryFields?.map((field, index) => {
                            const { caption } = field;
                            const currFieldKey = field.getDisplayFieldKey();
                            const hasFilter = filterStatus?.[queryName + '-' + currFieldKey];
                            return (
                                <ChoicesListItem
                                    active={currFieldKey === activeFieldKey}
                                    index={index}
                                    key={currFieldKey}
                                    label={caption}
                                    onSelect={() => onFieldClick(field)}
                                    componentRight={
                                        hasFilter && <span className="pull-right filter-modal__field_dot" />
                                    }
                                />
                            );
                        })}
                    </div>
                )}
            </Col>
            <Col xs={12} sm={fullWidth ? 8 : 6} className="filter-modal__col filter-modal__col_filter_exp">
                <div className="filter-modal__col-title">Values</div>
                {queryName && !activeField && <div className="filter-modal__empty-msg">Select a field.</div>}
                {queryName && activeField && (
                    <div className="filter-modal__col-content">
                        <Tab.Container
                            activeKey={activeTab}
                            className="filter-modal__tabs content-tabs"
                            id="filter-field-tabs"
                            onSelect={key => onTabChange(key)}
                        >
                            <div>
                                <Nav bsStyle="tabs">
                                    <NavItem eventKey={EntityFieldFilterTabs.Filter}>Filter</NavItem>
                                    {allowFaceting(activeField) && (
                                        <NavItem eventKey={EntityFieldFilterTabs.ChooseValues}>
                                            {CHOOSE_VALUES_TAB_KEY}
                                        </NavItem>
                                    )}
                                </Nav>
                                <Tab.Content animation className="filter-modal__values-col-content">
                                    <Tab.Pane eventKey={EntityFieldFilterTabs.Filter}>
                                        <div className="filter-modal__col-sub-title">
                                            Find values for {activeField.caption}
                                        </div>
                                        {activeTab === EntityFieldFilterTabs.Filter && (
                                            <FilterExpressionView
                                                key={activeFieldKey}
                                                field={activeField}
                                                fieldFilter={currentFieldFilter?.filter}
                                                onFieldFilterUpdate={newFilter =>
                                                    onFilterUpdate(activeField, newFilter)
                                                }
                                            />
                                        )}
                                    </Tab.Pane>
                                    {activeTab === EntityFieldFilterTabs.ChooseValues && allowFaceting(activeField) && (
                                        <Tab.Pane eventKey={EntityFieldFilterTabs.ChooseValues}>
                                            <div className="filter-modal__col-sub-title">
                                                Find values for {activeField.caption}
                                            </div>
                                            <FilterFacetedSelector
                                                selectDistinctOptions={{
                                                    ...selectDistinctOptions,
                                                    column: activeFieldKey,
                                                    schemaName: queryInfo.schemaName,
                                                    queryName,
                                                    viewName,
                                                    // TODO this doesn't seem right for the cases like the SM source
                                                    // samples grid which has a model filter for the source ID
                                                    // which is getting overridden here. Try using
                                                    // selectDistinctOptions.filterArray from props in fieldDistinctValueFilters
                                                    filterArray: fieldDistinctValueFilters,
                                                }}
                                                fieldFilter={currentFieldFilter?.filter}
                                                fieldKey={activeFieldKey}
                                                key={activeFieldKey}
                                                onFieldFilterUpdate={newFilter =>
                                                    onFilterUpdate(activeField, newFilter)
                                                }
                                            />
                                        </Tab.Pane>
                                    )}
                                </Tab.Content>
                            </div>
                        </Tab.Container>
                    </div>
                )}
            </Col>
        </>
    );
});

QueryFilterPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};
