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

import { FilterFacetedSelector } from './FilterFacetedSelector';

import { FilterExpressionView } from './FilterExpressionView';
import { FieldFilter, FilterProps } from './models';
import { getFieldFiltersValidationResult } from './utils';

interface Props {
    api?: ComponentsAPIWrapper;
    entityDataType: EntityDataType;
    onCancel: () => void;
    onFind: (schemaName: string, dataTypeFilters: { [key: string]: FieldFilter[] }) => void;
    queryName?: string;
    fieldKey?: string;
    showAllFields?: boolean; // all fields types, including non-text fields
    cards?: FilterProps[];
    skipDefaultViewCheck?: boolean; // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
}

export enum EntityFieldFilterTabs {
    Filter = 'Filter',
    ChooseValues = 'Choose values',
}

export const EntityFieldFilterModal: FC<Props> = memo(props => {
    const { api, entityDataType, onCancel, onFind, cards, queryName, fieldKey, showAllFields, skipDefaultViewCheck } =
        props;

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

            setLoadingError(undefined);
            api.query
                .getQueryDetails({ schemaName: entityDataType.instanceSchemaName, queryName })
                .then(queryInfo => {
                    const fields = skipDefaultViewCheck ? queryInfo.getAllColumns() : queryInfo.getDisplayColumns();
                    let supportedFields = fields;
                    if (!showAllFields) {
                        // TODO only support string fields until MVFK (multi value FK) server side work is completed
                        supportedFields = fromJS(fields.filter(field => field.jsonType === 'string'));
                    }

                    setQueryFields(supportedFields);
                    if (fieldKey) {
                        const field = supportedFields.find(field => field.fieldKey === fieldKey);
                        setActiveField(field);
                    }
                })
                .catch(error => {
                    setLoadingError(resolveErrorMessage(error, queryName, queryName, 'load'));
                });
        },
        [api, entityDataType, skipDefaultViewCheck, showAllFields]
    );

    const onFieldClick = useCallback(
        (queryColumn: QueryColumn) => {
            setActiveField(queryColumn);

            if (activeTab === EntityFieldFilterTabs.ChooseValues && !queryColumn.allowFaceting()) {
                setActiveTab(EntityFieldFilterTabs.Filter);
            }
        },
        [activeTab]
    );

    const onTabChange = useCallback((tabKey: any) => {
        setActiveTab(tabKey);
    }, []);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onFind = useCallback(() => {
        const filterErrors = getFieldFiltersValidationResult(dataTypeFilters);
        if (!filterErrors) onFind(entityDataType.instanceSchemaName, dataTypeFilters);
        else setFilterError(filterErrors);
    }, [onFind, dataTypeFilters]);

    const currentFieldFilter = useMemo(() => {
        if (!dataTypeFilters || !activeField) return null;

        const activeParentFilters: FieldFilter[] = dataTypeFilters[activeQuery];
        return activeParentFilters?.find(filter => filter.fieldKey === activeField.fieldKey);
    }, [activeField, activeQuery, dataTypeFilters]);

    const onFilterUpdate = useCallback(
        (newFilter: Filter.IFilter) => {
            setFilterError(undefined);

            const dataTypeFiltersUpdated = { ...dataTypeFilters };
            const activeParentFilters: FieldFilter[] = dataTypeFiltersUpdated[activeQuery];
            const newParentFilters =
                activeParentFilters?.filter(filter => filter.fieldKey != activeField.fieldKey) ?? [];

            if (newFilter != null)
                newParentFilters.push({
                    fieldKey: activeField.fieldKey,
                    fieldCaption: activeField.caption,
                    filter: newFilter,
                });

            if (newParentFilters?.length > 0) dataTypeFiltersUpdated[activeQuery] = newParentFilters;
            else delete dataTypeFiltersUpdated[activeQuery];

            setDataTypeFilters(dataTypeFiltersUpdated);
        },
        [dataTypeFilters, activeQuery, activeField]
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
            if (field.fieldKey !== activeField.fieldKey) filters.push(field.filter);
        });

        return filters;
    }, [dataTypeFilters, activeQuery, activeField]);

    // TODO when populating types, adjust container filter to include the proper set of sample types
    //  (current + project + shared, in most cases).  For LKB, check if we should filter out any of the
    //  registry data types or the media types.

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Select Sample {capParentNoun} Properties</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingError && <Alert>{loadingError}</Alert>}
                {filterError && <Alert>{filterError}</Alert>}
                <Row className="parent-search-panel__container">
                    <Col xs={3} className="parent-search-panel__col parent-search-panel__col_queries">
                        <div className="parent-search-panel__col-title">
                            {entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}
                        </div>
                        <div className="list-group parent-search-panel__col-content">
                            {!entityQueries && <LoadingSpinner />}
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
                    <Col xs={3} className="parent-search-panel__col parent-search-panel__col_fields">
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
                                {!queryFields && <LoadingSpinner />}
                                {queryFields?.map((field, index) => {
                                    const { fieldKey, caption } = field;
                                    const hasFilter = filterStatus?.[activeQuery + '-' + fieldKey];
                                    return (
                                        <ChoicesListItem
                                            active={fieldKey === activeField?.fieldKey}
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
                    <Col xs={6} className="parent-search-panel__col parent-search-panel__col_filter_exp">
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
                                            {(!activeField || activeField?.allowFaceting()) && (
                                                <NavItem eventKey={EntityFieldFilterTabs.ChooseValues}>
                                                    Choose values
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
                                                        key={activeField.fieldKey}
                                                        field={activeField}
                                                        fieldFilter={currentFieldFilter?.filter}
                                                        onFieldFilterUpdate={onFilterUpdate}
                                                    />
                                                )}
                                            </Tab.Pane>
                                            <Tab.Pane eventKey={EntityFieldFilterTabs.ChooseValues}>
                                                <div className="parent-search-panel__col-sub-title">
                                                    Find values for {activeField.caption}
                                                </div>
                                                {activeTab === EntityFieldFilterTabs.ChooseValues &&
                                                    activeField?.jsonType === 'string' &&
                                                    activeField?.allowFaceting() && (
                                                        <FilterFacetedSelector
                                                            selectDistinctOptions={{
                                                                column: activeField?.fieldKey,
                                                                schemaName: entityDataType?.instanceSchemaName,
                                                                queryName: activeQuery,
                                                                viewName: '',
                                                                filterArray: fieldDistinctValueFilters,
                                                            }}
                                                            fieldFilter={currentFieldFilter?.filter}
                                                            fieldKey={activeField.fieldKey}
                                                            key={activeField.fieldKey}
                                                            onFieldFilterUpdate={onFilterUpdate}
                                                        />
                                                    )}
                                            </Tab.Pane>
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
                        disabled={Object.keys(dataTypeFilters).length === 0}
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
