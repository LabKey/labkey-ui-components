import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Nav, NavItem, Tab } from 'react-bootstrap';
import { fromJS, List } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { FilterFacetedSelector } from './FilterFacetedSelector';
import { FilterExpressionView } from './FilterExpressionView';
import { FieldFilter } from './models';
import { isChooseValuesFilter } from './utils';

enum FieldFilterTabs {
    ChooseValues = 'ChooseValues',
    Filter = 'Filter',
}

const DEFAULT_VIEW_NAME = ''; // always use default view for selection, if none provided
const CHOOSE_VALUES_TAB_KEY = 'Choose values';

interface Props {
    api?: ComponentsAPIWrapper;
    asRow?: boolean;
    emptyMsg?: string;
    entityDataType?: EntityDataType; // used for Sample Finder use case
    fieldKey?: string;
    filters: { [key: string]: FieldFilter[] };
    fullWidth?: boolean;
    metricFeatureArea?: string;
    onFilterUpdate: (field: QueryColumn, newFilters: Filter.IFilter[], index: number) => void;
    queryInfo: QueryInfo;
    selectDistinctOptions?: Query.SelectDistinctOptions;
    skipDefaultViewCheck?: boolean;
    validFilterField?: (field: QueryColumn, queryInfo: QueryInfo, exprColumnsWithSubSelect?: string[]) => boolean;
    viewName?: string;
}

export const QueryFilterPanel: FC<Props> = memo(props => {
    const {
        asRow,
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
    const [activeTab, setActiveTab] = useState<FieldFilterTabs>(undefined);

    const queryName = useMemo(() => queryInfo?.name.toLowerCase(), [queryInfo]);
    const viewName = useMemo(() => props.viewName ?? DEFAULT_VIEW_NAME, [props.viewName]);
    const allowFaceting = (col: QueryColumn): boolean => {
        return col?.allowFaceting() && col?.getDisplayFieldJsonType() === 'string'; // current plan is to only support facet for string fields, to reduce scope
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
            return filterStatus?.[queryName.toLowerCase() + '-' + field.resolveFieldKey()];
        },
        [filterStatus, queryName]
    );

    const getDefaultActiveTab = useCallback(
        (field: QueryColumn) => {
            if (!allowFaceting(field)) {
                return FieldFilterTabs.Filter;
            }
            if (!hasFilters(field)) {
                return FieldFilterTabs.ChooseValues;
            }
            const currentFieldFilters = filters[queryName].filter(
                filterField => filterField.fieldKey === field.resolveFieldKey()
            );
            if (currentFieldFilters.length > 1) {
                return FieldFilterTabs.Filter;
            }
            return isChooseValuesFilter(currentFieldFilters[0].filter)
                ? FieldFilterTabs.ChooseValues
                : FieldFilterTabs.Filter;
        },
        [hasFilters, filters, queryName]
    );

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
        }
    }, [
        queryInfo,
        skipDefaultViewCheck,
        validFilterField,
        entityDataType?.exprColumnsWithSubSelect,
        fieldKey,
        viewName,
    ]);

    useEffect(() => {
        if (activeField) setActiveTab(getDefaultActiveTab(activeField));
    }, [activeField]); // don't include getDefaultActiveTab as we only want this to be triggered when the field selection changes

    const activeFieldKey = useMemo(() => {
        return activeField?.getDisplayFieldKey();
    }, [activeField]);

    const currentFieldFilters = useMemo((): FieldFilter[] => {
        if (!filters || !activeField) return null;

        const activeQueryFilters: FieldFilter[] = filters[queryName];
        return activeQueryFilters?.filter(filter => filter.fieldKey === activeFieldKey);
    }, [activeField, queryName, filters, activeFieldKey]);

    const fieldDistinctValueFilters = useMemo(() => {
        if (!filters || !queryName || !activeField) return null;

        // Issue 45135: include any model filters (baseFilters or queryInfo filters)
        const valueFilters = selectDistinctOptions ? [...selectDistinctOptions.filterArray] : [];

        // use active filters to filter distinct values, but exclude filters on current field
        filters?.[queryName]?.forEach(field => {
            if (field.fieldKey !== activeFieldKey) valueFilters.push(field.filter);
        });

        return valueFilters;
    }, [filters, queryName, activeField, activeFieldKey, selectDistinctOptions]);

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        setActiveField(queryColumn);
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

    const body = (
        <>
            <Col xs={fullWidth ? 12 : 6} sm={fullWidth ? 4 : 3} className="field-modal__col filter-modal__col_fields">
                <div className="field-modal__col-title">Fields</div>
                {!queryName && emptyMsg && <div className="field-modal__empty-msg">{emptyMsg}</div>}
                {queryName && (
                    <div className="list-group field-modal__col-content filter-modal__fields-col-content">
                        {!queryFields && <LoadingSpinner wrapperClassName="loading-spinner" />}
                        {queryFields?.map((field, index) => {
                            const { caption } = field;
                            const currFieldKey = field.getDisplayFieldKey();
                            return (
                                <ChoicesListItem
                                    active={currFieldKey === activeFieldKey}
                                    index={index}
                                    key={currFieldKey}
                                    label={caption}
                                    onSelect={() => onFieldClick(field)}
                                    componentRight={
                                        hasFilters(field) && <span className="pull-right field-modal__field_dot" />
                                    }
                                />
                            );
                        })}
                    </div>
                )}
            </Col>
            <Col xs={12} sm={fullWidth ? 8 : 6} className="field-modal__col filter-modal__col_filter_exp">
                <div className="field-modal__col-title">Values</div>
                {queryName && !activeField && <div className="field-modal__empty-msg">Select a field.</div>}
                {queryName && activeField && (
                    <div className="field-modal__col-content field-modal__values">
                        <Tab.Container
                            activeKey={activeTab}
                            className="field-modal__tabs content-tabs"
                            id="filter-field-tabs"
                            onSelect={key => onTabChange(key)}
                        >
                            <div>
                                <Nav bsStyle="tabs">
                                    <NavItem eventKey={FieldFilterTabs.Filter}>Filter</NavItem>
                                    {allowFaceting(activeField) && (
                                        <NavItem eventKey={FieldFilterTabs.ChooseValues}>
                                            {CHOOSE_VALUES_TAB_KEY}
                                        </NavItem>
                                    )}
                                </Nav>
                                <Tab.Content animation className="filter-modal__values-col-content">
                                    <Tab.Pane eventKey={FieldFilterTabs.Filter}>
                                        <div className="field-modal__col-sub-title">
                                            Find values for {activeField.caption}
                                        </div>
                                        {activeTab === FieldFilterTabs.Filter && (
                                            <FilterExpressionView
                                                key={activeFieldKey}
                                                field={activeField}
                                                fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
                                                onFieldFilterUpdate={(newFilters, index) =>
                                                    onFilterUpdate(activeField, newFilters, index)
                                                }
                                            />
                                        )}
                                    </Tab.Pane>
                                    {activeTab === FieldFilterTabs.ChooseValues && allowFaceting(activeField) && (
                                        <Tab.Pane eventKey={FieldFilterTabs.ChooseValues}>
                                            <div className="field-modal__col-sub-title">
                                                Find values for {activeField.caption}
                                            </div>
                                            <FilterFacetedSelector
                                                selectDistinctOptions={{
                                                    ...selectDistinctOptions,
                                                    column: activeFieldKey,
                                                    schemaName: queryInfo.schemaName,
                                                    queryName,
                                                    filterArray: fieldDistinctValueFilters,
                                                }}
                                                fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
                                                fieldKey={activeFieldKey}
                                                canBeBlank={!activeField?.required && !activeField.nameExpression}
                                                key={activeFieldKey}
                                                onFieldFilterUpdate={(newFilters, index) =>
                                                    onFilterUpdate(activeField, newFilters, index)
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

    if (asRow) {
        return <Row className="field-modal__container">{body}</Row>;
    } else {
        return body;
    }
});

QueryFilterPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};
