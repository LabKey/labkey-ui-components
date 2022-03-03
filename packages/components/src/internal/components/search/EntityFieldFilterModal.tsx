import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Modal, Nav, NavItem, Row, Tab } from 'react-bootstrap';
import { fromJS, List } from 'immutable';

import { Filter } from '@labkey/api';

import { EntityDataType, IEntityTypeOption } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { Alert } from '../base/Alert';

import { resolveErrorMessage } from '../../util/messaging';

import { naturalSortByProperty } from '../../../public/sort';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { FilterFacetedSelector } from './FilterFacetedSelector';
import { FilterExpressionView } from './FilterExpressionView';
import { FieldFilter, FilterProps } from './models';
import { getFieldFiltersValidationResult } from './utils';

interface Props {
    api?: ComponentsAPIWrapper;
    entityDataType: EntityDataType;
    onCancel: () => void;
    onFind: (
        schemaName: string,
        dataTypeFilters: { [key: string]: FieldFilter[] },
        queryLabels: { [key: string]: string }
    ) => void;
    queryName?: string;
    fieldKey?: string;
    cards?: FilterProps[];
    skipDefaultViewCheck?: boolean; // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
    metricFeatureArea?: string;
}

export enum EntityFieldFilterTabs {
    Filter = 'Filter',
    ChooseValues = 'Choose values',
}

const FIND_FILTER_VIEW_NAME = ''; // always use default view for selection
const CHOOSE_VALUES_TAB_KEY = 'Choose values';

export const EntityFieldFilterModal: FC<Props> = memo(props => {
    const {
        api,
        entityDataType,
        onCancel,
        onFind,
        cards,
        queryName,
        fieldKey,
        skipDefaultViewCheck,
        metricFeatureArea,
    } = props;

    const capParentNoun = capitalizeFirstChar(entityDataType.nounAsParentSingular);

    const [entityQueries, setEntityQueries] = useState<IEntityTypeOption[]>(undefined);
    const [queryFields, setQueryFields] = useState<List<QueryColumn>>(undefined);

    const [activeQuery, setActiveQuery] = useState<string>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [activeTab, setActiveTab] = useState<EntityFieldFilterTabs>(EntityFieldFilterTabs.Filter);

    const [loadingError, setLoadingError] = useState<string>(undefined);
    const [filterError, setFilterError] = useState<string>(undefined);

    const [dataTypeFilters, setDataTypeFilters] = useState<{ [key: string]: FieldFilter[] }>({});

    useEffect(() => {
        const activeDataTypeFilters = {};

        cards?.forEach(card => {
            if (card.entityDataType.instanceSchemaName !== entityDataType.instanceSchemaName) return;
            const parent = card.schemaQuery.queryName;
            activeDataTypeFilters[parent] = card.filterArray;
        });
        setDataTypeFilters(activeDataTypeFilters);

        setLoadingError(undefined);
        api.query
            .getEntityTypeOptions(entityDataType)
            .then(results => {
                const parents = [];
                results.map(result => {
                    result.map(res => {
                        parents.push(res);
                    });
                });
                setEntityQueries(parents.sort(naturalSortByProperty('label')));
                if (queryName) {
                    onEntityClick(queryName, fieldKey);
                }
            })
            .catch(error => {
                setLoadingError(
                    resolveErrorMessage(
                        error,
                        entityDataType.nounAsParentSingular,
                        entityDataType.nounAsParentPlural,
                        'load'
                    )
                );
            });
    }, [entityDataType]); // don't add cards or queryName to deps, only init DataTypeFilters once per entityDataType

    const onEntityClick = useCallback(
        (queryName: string, fieldKey?: string) => {
            setActiveQuery(queryName);
            setQueryFields(undefined);
            setActiveField(undefined);

            if (activeTab === EntityFieldFilterTabs.ChooseValues) {
                setActiveTab(EntityFieldFilterTabs.Filter);
            }

            setLoadingError(undefined);
            api.query
                .getQueryDetails({ schemaName: entityDataType.instanceSchemaName, queryName })
                .then(queryInfo => {
                    const fields = skipDefaultViewCheck ? queryInfo.getAllColumns() : queryInfo.getDisplayColumns();
                    let supportedFields = fields;
                    if (!queryInfo.supportGroupConcatSubSelect && entityDataType.exprColumnsWithSubSelect?.length > 0) {
                        supportedFields = fromJS(
                            fields.filter(
                                field => entityDataType.exprColumnsWithSubSelect.indexOf(field.fieldKey) === -1
                            )
                        );
                    }
                    setQueryFields(supportedFields);
                    if (fieldKey) {
                        const field = fields.find(field => field.getDisplayFieldKey() === fieldKey);
                        setActiveField(field);
                    }
                })
                .catch(error => {
                    setLoadingError(resolveErrorMessage(error, queryName, queryName, 'load'));
                });
        },
        [api, entityDataType, skipDefaultViewCheck]
    );

    const allowFaceting = useMemo(() => {
        return activeField?.allowFaceting() && activeField?.getDisplayFieldJsonType() === 'string'; // current plan is to only support facet for string fields, to reduce scope
    }, [activeField]);

    const onFieldClick = useCallback(
        (queryColumn: QueryColumn) => {
            setActiveField(queryColumn);

            if (activeTab === EntityFieldFilterTabs.ChooseValues) {
                setActiveTab(EntityFieldFilterTabs.Filter);
            }
        },
        [activeTab, activeField]
    );

    const activeFieldKey = useMemo(() => {
        return activeField?.getDisplayFieldKey();
    }, [activeField]);

    const onTabChange = useCallback((tabKey: any) => {
        setActiveTab(tabKey);

        if (tabKey === CHOOSE_VALUES_TAB_KEY) {
            api.query.incrementClientSideMetricCount(metricFeatureArea, 'goToChooseValuesTab');
        }
    }, []);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const validDataTypeFilters = useMemo(() => {
        if (!dataTypeFilters) return null;

        const filters = {};
        Object.keys(dataTypeFilters).forEach(parent => {
            const filterFields = dataTypeFilters[parent];
            filters[parent] = filterFields.filter(field => {
                const urlSuffix = field?.filter?.getFilterType()?.getURLSuffix();
                return urlSuffix !== NOT_ANY_FILTER_TYPE.getURLSuffix() && urlSuffix !== '';
            });
        });
        return filters;
    }, [dataTypeFilters]);

    const _onFind = useCallback(() => {
        const queryLabels = {};
        entityQueries?.map(parent => {
            const label = parent.label ?? parent.get?.('label');
            const parentValue = parent.value ?? parent.get?.('value');
            queryLabels[parentValue] = label;
        });
        const filterErrors = getFieldFiltersValidationResult(validDataTypeFilters, queryLabels);
        if (!filterErrors) {
            onFind(entityDataType.instanceSchemaName, validDataTypeFilters, queryLabels);
        } else {
            setFilterError(filterErrors);
            api.query.incrementClientSideMetricCount(metricFeatureArea, 'filterModalError');
        }
    }, [api, metricFeatureArea, entityQueries, entityDataType.instanceSchemaName, onFind, validDataTypeFilters]);

    const currentFieldFilter = useMemo(() => {
        if (!dataTypeFilters || !activeField) return null;

        const activeParentFilters: FieldFilter[] = dataTypeFilters[activeQuery];
        return activeParentFilters?.find(filter => filter.fieldKey === activeFieldKey);
    }, [activeField, activeQuery, dataTypeFilters, activeFieldKey]);

    const onFilterUpdate = useCallback(
        (newFilter: Filter.IFilter) => {
            setFilterError(undefined);

            const dataTypeFiltersUpdated = { ...dataTypeFilters };
            const activeParentFilters: FieldFilter[] = dataTypeFiltersUpdated[activeQuery];
            const newParentFilters = activeParentFilters?.filter(filter => filter.fieldKey != activeFieldKey) ?? [];

            if (newFilter != null)
                newParentFilters.push({
                    fieldKey: activeFieldKey,
                    fieldCaption: activeField.caption,
                    filter: newFilter,
                    jsonType: activeField.getDisplayFieldJsonType(),
                } as FieldFilter);

            if (newParentFilters?.length > 0) dataTypeFiltersUpdated[activeQuery] = newParentFilters;
            else delete dataTypeFiltersUpdated[activeQuery];

            setDataTypeFilters(dataTypeFiltersUpdated);
        },
        [dataTypeFilters, activeQuery, activeField, activeFieldKey]
    );

    const filterStatus = useMemo(() => {
        const status = {};
        if (!dataTypeFilters) return {};

        Object.keys(dataTypeFilters).forEach(parent => {
            const filterFields = dataTypeFilters[parent];
            filterFields.forEach(field => {
                const key = parent + '-' + field.fieldKey;
                status[key] = true;
            });
        });

        return status;
    }, [dataTypeFilters]);

    const fieldDistinctValueFilters = useMemo(() => {
        if (!dataTypeFilters || !activeQuery || !activeField) return null;

        const filters = [];

        // use active filters to filter distinct values, but exclude filters on current field
        dataTypeFilters?.[activeQuery]?.forEach(field => {
            if (field.fieldKey !== activeFieldKey) filters.push(field.filter);
        });

        return filters;
    }, [dataTypeFilters, activeQuery, activeField, activeFieldKey]);

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Select Sample {capParentNoun} Properties</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingError && <Alert>{loadingError}</Alert>}
                {filterError && <Alert>{filterError}</Alert>}
                <Row className="parent-search-panel__container">
                    <Col xs={6} sm={3} className="parent-search-panel__col parent-search-panel__col_queries">
                        <div className="parent-search-panel__col-title">
                            {entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}
                        </div>
                        <div className="list-group parent-search-panel__col-content">
                            {!entityQueries && <LoadingSpinner wrapperClassName="loading-spinner" />}
                            {entityQueries?.map((parent, index) => {
                                const label = parent.label ?? parent.get?.('label'); // jest test data is Map, instead of js object
                                const parentValue = parent.value ?? parent.get?.('value');
                                const fieldFilterCount = dataTypeFilters?.[parentValue]?.length ?? 0;
                                return (
                                    <ChoicesListItem
                                        active={parentValue === activeQuery}
                                        index={index}
                                        key={parent.rowId + ''}
                                        label={label}
                                        onSelect={() => onEntityClick(parentValue)}
                                        componentRight={
                                            fieldFilterCount !== 0 && (
                                                <span className="pull-right field_count_circle">
                                                    {fieldFilterCount}
                                                </span>
                                            )
                                        }
                                    />
                                );
                            })}
                        </div>
                    </Col>
                    <Col xs={6} sm={3} className="parent-search-panel__col parent-search-panel__col_fields">
                        <div className="parent-search-panel__col-title">Fields</div>
                        {!activeQuery && (
                            <div className="parent-search-panel__empty-msg">
                                Select a{' '}
                                {entityDataType.nounAsParentSingular?.toLowerCase() ??
                                    entityDataType.nounSingular?.toLowerCase()}
                                .
                            </div>
                        )}
                        {activeQuery && (
                            <div className="list-group parent-search-panel__col-content parent-search-panel__fields-col-content">
                                {!queryFields && <LoadingSpinner wrapperClassName="loading-spinner" />}
                                {queryFields?.map((field, index) => {
                                    const { caption } = field;
                                    const fieldKey = field.getDisplayFieldKey();
                                    const hasFilter = filterStatus?.[activeQuery + '-' + fieldKey];
                                    return (
                                        <ChoicesListItem
                                            active={fieldKey === activeFieldKey}
                                            index={index}
                                            key={fieldKey}
                                            label={caption}
                                            onSelect={() => onFieldClick(field)}
                                            componentRight={
                                                hasFilter && <span className="pull-right search_field_dot" />
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </Col>
                    <Col xs={12} sm={6} className="parent-search-panel__col parent-search-panel__col_filter_exp">
                        <div className="parent-search-panel__col-title">Values</div>
                        {activeQuery && !activeField && (
                            <div className="parent-search-panel__empty-msg">Select a field.</div>
                        )}
                        {activeQuery && activeField && (
                            <div className="parent-search-panel__col-content">
                                <Tab.Container
                                    activeKey={activeTab}
                                    className="parent-search-panel__tabs content-tabs"
                                    id="search-field-tabs"
                                    onSelect={key => onTabChange(key)}
                                >
                                    <div>
                                        <Nav bsStyle="tabs">
                                            <NavItem eventKey={EntityFieldFilterTabs.Filter}>Filter</NavItem>
                                            {allowFaceting && (
                                                <NavItem eventKey={EntityFieldFilterTabs.ChooseValues}>
                                                    {CHOOSE_VALUES_TAB_KEY}
                                                </NavItem>
                                            )}
                                        </Nav>
                                        <Tab.Content animation className="parent-search-panel__values-col-content">
                                            <Tab.Pane eventKey={EntityFieldFilterTabs.Filter}>
                                                <div className="parent-search-panel__col-sub-title">
                                                    Find values for {activeField.caption}
                                                </div>
                                                {activeTab === EntityFieldFilterTabs.Filter && (
                                                    <FilterExpressionView
                                                        key={activeFieldKey}
                                                        field={activeField}
                                                        fieldFilter={currentFieldFilter?.filter}
                                                        onFieldFilterUpdate={onFilterUpdate}
                                                    />
                                                )}
                                            </Tab.Pane>
                                            {activeTab === EntityFieldFilterTabs.ChooseValues && allowFaceting && (
                                                <Tab.Pane eventKey={EntityFieldFilterTabs.ChooseValues}>
                                                    <div className="parent-search-panel__col-sub-title">
                                                        Find values for {activeField.caption}
                                                    </div>
                                                    <FilterFacetedSelector
                                                        selectDistinctOptions={{
                                                            column: activeFieldKey,
                                                            schemaName: entityDataType?.instanceSchemaName,
                                                            queryName: activeQuery,
                                                            viewName: FIND_FILTER_VIEW_NAME,
                                                            filterArray: fieldDistinctValueFilters,
                                                        }}
                                                        fieldFilter={currentFieldFilter?.filter}
                                                        fieldKey={activeFieldKey}
                                                        key={activeFieldKey}
                                                        onFieldFilterUpdate={onFilterUpdate}
                                                    />
                                                </Tab.Pane>
                                            )}
                                        </Tab.Content>
                                    </div>
                                </Tab.Container>
                            </div>
                        )}
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={_onFind}
                        disabled={Object.keys(validDataTypeFilters).length === 0}
                    >
                        Find Samples
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});

EntityFieldFilterModal.defaultProps = {
    api: getDefaultAPIWrapper(),
};
