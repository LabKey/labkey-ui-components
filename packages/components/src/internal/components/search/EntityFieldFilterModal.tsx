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
import { getFieldFiltersValidationResult, isValidFilterField } from './utils';

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
    const [activeTab, setActiveTab] = useState<EntityFieldFilterTabs>(undefined);

    const [loadingError, setLoadingError] = useState<string>(undefined);
    const [filterError, setFilterError] = useState<string>(undefined);

    // key is the parent query name
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


    const filterStatus = useMemo(() => {
        const status = {};
        if (!dataTypeFilters) return {};

        Object.keys(dataTypeFilters).forEach(parent => {
            const filterFields = dataTypeFilters[parent];
            filterFields.forEach(field => {
                if (field.filter.getFilterType() !== NOT_ANY_FILTER_TYPE) {
                    const key = parent + '-' + field.fieldKey;
                    status[key] = true;
                }
            });
        });

        return status;
    }, [dataTypeFilters]);

    const hasFilters = useCallback((field: QueryColumn) => {
        return filterStatus?.[activeQuery + '-' + field.fieldKey];
    }, [filterStatus, activeQuery]);


    const onEntityClick = useCallback(
        (queryName: string, fieldKey?: string) => {
            setActiveQuery(queryName);
            setQueryFields(undefined);
            setActiveField(undefined);
            setLoadingError(undefined);
            api.query
                .getQueryDetails({ schemaName: entityDataType.instanceSchemaName, queryName })
                .then(queryInfo => {
                    const fields = skipDefaultViewCheck ? queryInfo.getAllColumns() : queryInfo.getDisplayColumns();
                    setQueryFields(fromJS(fields.filter(field => isValidFilterField(field, queryInfo, entityDataType))));
                    if (fieldKey) {
                        const field = fields.find(field => field.getDisplayFieldKey() === fieldKey);
                        setActiveField(field);
                        if (allowFaceting(field) && !hasFilters(field)) {
                            setActiveTab(EntityFieldFilterTabs.ChooseValues);
                        } else {
                            setActiveTab(EntityFieldFilterTabs.Filter);
                        }
                    }
                })
                .catch(error => {
                    setLoadingError(resolveErrorMessage(error, queryName, queryName, 'load'));
                });
        },
        [api, hasFilters, entityDataType, skipDefaultViewCheck]
    );

    const allowFaceting = (activeField: QueryColumn) => {
        return activeField?.allowFaceting() && activeField?.getDisplayFieldJsonType() === 'string'; // current plan is to only support facet for string fields, to reduce scope
    };

    const onFieldClick = useCallback(
        (queryColumn: QueryColumn) => {
            setActiveField(queryColumn);
            setActiveTab(allowFaceting(queryColumn)  && !hasFilters(queryColumn) ? EntityFieldFilterTabs.ChooseValues : EntityFieldFilterTabs.Filter);
        },
        [activeTab, activeField, hasFilters]
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
            const parentFilters = filterFields.filter(field => {
                const urlSuffix = field?.filter?.getFilterType()?.getURLSuffix();
                return urlSuffix !== NOT_ANY_FILTER_TYPE.getURLSuffix() && urlSuffix !== '';
            });
            if (parentFilters.length > 0) {
                filters[parent] = parentFilters;
            }
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

    const currentFieldFilters = useMemo(() : FieldFilter[] => {
        if (!dataTypeFilters || !activeField) return null;

        const activeParentFilters: FieldFilter[] = dataTypeFilters[activeQuery];
        return activeParentFilters?.filter(filter => filter?.fieldKey === activeFieldKey);
    }, [activeField, activeQuery, dataTypeFilters, activeFieldKey]);

    const onFilterUpdate = useCallback(
        (newFilter: Filter.IFilter, index: number) => {
            setFilterError(undefined);

            const dataTypeFiltersUpdated = { ...dataTypeFilters };
            const activeParentFilters: FieldFilter[] = dataTypeFiltersUpdated[activeQuery];

            const otherFieldFilters = []; // the filters on the parent type that aren't associated with this field.
            let thisFieldFilters = []; // the filters on the parent type currently associated with this field.
            activeParentFilters?.forEach(filter => {
                if (filter.fieldKey === activeFieldKey ) {
                    // on the ChooseValues tab, once we interact to select values, we'll remove the second filter, if it exists
                    if (activeTab === EntityFieldFilterTabs.Filter) thisFieldFilters.push(filter);
                } else {
                    otherFieldFilters.push(filter);
                }
            });


            if (newFilter != null) {
                const fieldFilter = {
                    fieldKey: activeFieldKey,
                    fieldCaption: activeField.caption,
                    filter: newFilter,
                    jsonType: activeField.getDisplayFieldJsonType(),
                } as FieldFilter;


                if (activeTab === EntityFieldFilterTabs.Filter && index < thisFieldFilters.length) {
                    thisFieldFilters[index] = fieldFilter;
                } else {
                    thisFieldFilters.push(fieldFilter);
                }
            } else {
                if (index < thisFieldFilters.length) {
                    thisFieldFilters = [
                        ...thisFieldFilters.slice(0, index),
                        ...thisFieldFilters.slice(index+1)
                    ]
                }
            }


            if (otherFieldFilters.length + thisFieldFilters.length > 0) {
                dataTypeFiltersUpdated[activeQuery] = [...otherFieldFilters, ...thisFieldFilters];
            }
            else {
                delete dataTypeFiltersUpdated[activeQuery];
            }

            setDataTypeFilters(dataTypeFiltersUpdated);
        },
        [dataTypeFilters, activeQuery, activeField, activeFieldKey, activeTab]
    );

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
                <Alert>{loadingError}</Alert>
                <Alert>{filterError}</Alert>
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
                                const fieldFilterCount = dataTypeFilters?.[parentValue]?.filter(f => f.filter.getFilterType() !== NOT_ANY_FILTER_TYPE)?.length ?? 0;
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
                                    return (
                                        <ChoicesListItem
                                            active={fieldKey === activeFieldKey}
                                            index={index}
                                            key={fieldKey}
                                            label={caption}
                                            onSelect={() => onFieldClick(field)}
                                            componentRight={
                                                hasFilters(field) && <span className="pull-right search_field_dot" />
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
                                            {allowFaceting(activeField) && (
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
                                                        fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
                                                        onFieldFilterUpdate={onFilterUpdate}
                                                    />
                                                )}
                                            </Tab.Pane>
                                            {activeTab === EntityFieldFilterTabs.ChooseValues && allowFaceting(activeField) && (
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
                                                        fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
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
