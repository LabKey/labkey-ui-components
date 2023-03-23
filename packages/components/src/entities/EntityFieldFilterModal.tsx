import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';
import { List } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { EntityDataType, IEntityTypeOption } from '../internal/components/entities/models';
import { capitalizeFirstChar } from '../internal/util/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { ChoicesListItem } from '../internal/components/base/ChoicesListItem';

import { QueryColumn } from '../public/QueryColumn';
import { QueryInfo } from '../public/QueryInfo';
import { Alert } from '../internal/components/base/Alert';

import { resolveErrorMessage } from '../internal/util/messaging';

import { naturalSortByProperty } from '../public/sort';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { NOT_ANY_FILTER_TYPE } from '../internal/url/NotAnyFilterType';

import { AssayResultDataType, SamplePropertyDataType } from '../internal/components/entities/constants';

import { COLUMN_NOT_IN_FILTER_TYPE } from '../internal/query/filter';

import { FieldFilter, FilterProps } from '../internal/components/search/models';
import {
    getDataTypeFiltersWithNotInQueryUpdate,
    getFieldFiltersValidationResult,
    getUpdatedDataTypeFilters,
    isValidFilterFieldExcludeLookups,
} from '../internal/components/search/utils';
import { QueryFilterPanel } from '../internal/components/search/QueryFilterPanel';

import { AssaySampleColumnProp } from '../internal/sampleModels';
import { isLoading, LoadingState } from '../public/LoadingState';
import { SAMPLE_PROPERTY_ALL_SAMPLE_TYPE } from '../internal/components/search/constants';

import { getSamplePropertyFields } from './utils';

export interface EntityFieldFilterModalProps {
    api?: ComponentsAPIWrapper;
    assaySampleIdCols?: Record<string, AssaySampleColumnProp>;
    cards?: FilterProps[];
    entityDataType: EntityDataType;
    fieldKey?: string;
    metricFeatureArea?: string;
    onCancel: () => void;
    onFind: (
        entityDataType: EntityDataType,
        dataTypeFilters: { [key: string]: FieldFilter[] },
        queryLabels: { [key: string]: string },
        queryLsids?: { [key: string]: string }
    ) => void;
    queryName?: string;
    setCardDirty?: (dirty: boolean) => void;
    // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
    skipDefaultViewCheck?: boolean;
}

export const EntityFieldFilterModal: FC<EntityFieldFilterModalProps> = memo(props => {
    const {
        api,
        assaySampleIdCols,
        entityDataType,
        onCancel,
        onFind,
        cards,
        queryName,
        fieldKey,
        setCardDirty,
        skipDefaultViewCheck,
        metricFeatureArea,
    } = props;

    const allowRelativeDateFilter = entityDataType.allowRelativeDateFilter;
    const capParentNoun = capitalizeFirstChar(entityDataType.nounAsParentSingular);
    const [activeQuery, setActiveQuery] = useState<string>();
    const [activeQueryInfo, setActiveQueryInfo] = useState<QueryInfo>();
    const [entityQueries, setEntityQueries] = useState<IEntityTypeOption[]>([]);
    const [filterError, setFilterError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [loadingError, setLoadingError] = useState<string>();
    const isLoaded = !isLoading(loadingState);

    // key is the parent query name
    const [dataTypeFilters, setDataTypeFilters] = useState<Record<string, FieldFilter[]>>({});

    const onEntityClick = useCallback(
        async (selectedQueryName: string) => {
            try {
                let schemaName = entityDataType.instanceSchemaName;
                let _queryName = selectedQueryName;
                if (!schemaName && entityDataType.getInstanceSchemaQuery) {
                    const schemaQuery = entityDataType.getInstanceSchemaQuery(selectedQueryName);
                    schemaName = schemaQuery.schemaName;
                    _queryName = schemaQuery.queryName;
                }
                const queryInfo = await api.query.getQueryDetails({ schemaName, queryName: _queryName });
                setActiveQuery(selectedQueryName);
                setActiveQueryInfo(queryInfo);
                setLoadingError(undefined);
            } catch (error) {
                setLoadingError(resolveErrorMessage(error, selectedQueryName, selectedQueryName, 'load'));
            }
        },
        [api, entityDataType]
    );

    useEffect(() => {
        (async () => {
            setLoadingState(LoadingState.LOADING);
            setLoadingError(undefined);

            const activeDataTypeFilters = {};

            cards?.forEach(card => {
                if (card.entityDataType.instanceSchemaName !== entityDataType.instanceSchemaName) return;
                let parent = card.schemaQuery.queryName.toLowerCase(); // if is assay, change to datatype
                if (card.entityDataType.getInstanceDataType) {
                    parent = card.entityDataType.getInstanceDataType(card.schemaQuery, card.altQueryName).toLowerCase();
                    if (card.entityDataType.nounAsParentSingular === SamplePropertyDataType.nounAsParentSingular)
                        setActiveQuery(card.dataTypeDisplayName);
                }
                activeDataTypeFilters[parent] = card.filterArray;
            });

            setDataTypeFilters(activeDataTypeFilters);

            try {
                const results = await api.query.getEntityTypeOptions(entityDataType);

                // filter assays
                const parents = [];
                results.forEach(result => {
                    if (entityDataType.typeListingSchemaQuery === AssayResultDataType.typeListingSchemaQuery) {
                        result.forEach(assay => {
                            if (assaySampleIdCols?.[assay.value.toLowerCase()]) {
                                parents.push(assay);
                            }
                        });
                    } else {
                        result.forEach(res => {
                            parents.push(res);
                        });
                    }
                });
                parents.sort(naturalSortByProperty('label'));
                if (entityDataType.nounAsParentSingular === SamplePropertyDataType.nounAsParentSingular) {
                    parents.unshift(SAMPLE_PROPERTY_ALL_SAMPLE_TYPE);
                }
                setEntityQueries(parents);
                if (queryName) {
                    onEntityClick(queryName);
                }
            } catch (error) {
                setLoadingError(
                    resolveErrorMessage(
                        error,
                        entityDataType.nounAsParentSingular,
                        entityDataType.nounAsParentPlural,
                        'load'
                    )
                );
            } finally {
                setLoadingState(LoadingState.LOADED);
            }
        })();
    }, [entityDataType, queryName]); // don't add cards or queryName to deps, only init DataTypeFilters once per entityDataType

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
        const queryLsids = {};
        entityQueries.forEach(parent => {
            const label = parent.label ?? parent.get?.('label');
            const lsid = parent.lsid ?? parent.get?.('lsid');
            const parentValue = parent.value ?? parent.get?.('value');
            queryLabels[parentValue] = label;
            queryLsids[parentValue] = lsid;
        });
        const filterErrors = getFieldFiltersValidationResult(validDataTypeFilters, queryLabels);
        if (!filterErrors) {
            onFind(entityDataType, validDataTypeFilters, queryLabels, queryLsids);
        } else {
            setFilterError(filterErrors);
            api.query.incrementClientSideMetricCount(metricFeatureArea, 'filterModalError');
        }
    }, [api, metricFeatureArea, entityQueries, entityDataType, onFind, validDataTypeFilters]);

    const onFilterUpdate = useCallback(
        (field: QueryColumn, newFilters: Filter.IFilter[]) => {
            setCardDirty?.(true);
            setFilterError(undefined);
            setDataTypeFilters(
                getUpdatedDataTypeFilters(
                    dataTypeFilters,
                    activeQuery,
                    field,
                    newFilters,
                    entityDataType.allowSingleParentTypeFilter
                )
            );
        },
        [setCardDirty, dataTypeFilters, activeQuery, entityDataType]
    );

    const onHasNoValueInQueryChange = useCallback(
        (check: boolean) => {
            if (!entityDataType.supportHasNoValueInQuery) return;

            setCardDirty?.(true);
            setFilterError(undefined);
            const schemaQuery = entityDataType.getInstanceSchemaQuery(activeQuery);
            const selectQueryFilterKey = assaySampleIdCols[activeQuery]?.lookupFieldKey;
            const targetQueryFilterKey = assaySampleIdCols[activeQuery]?.fieldKey;
            setDataTypeFilters(
                getDataTypeFiltersWithNotInQueryUpdate(
                    dataTypeFilters,
                    schemaQuery,
                    activeQuery,
                    selectQueryFilterKey,
                    targetQueryFilterKey,
                    check
                )
            );
        },
        [entityDataType, setCardDirty, activeQuery, assaySampleIdCols, dataTypeFilters]
    );

    const hasNotInQueryFilter = useMemo((): boolean => {
        const activeQueryFilters: FieldFilter[] = dataTypeFilters[activeQuery];
        if (!activeQueryFilters || activeQueryFilters.length === 0) return false;

        return activeQueryFilters.some(
            fieldFilter =>
                fieldFilter.filter.getFilterType().getURLSuffix() === COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix()
        );
    }, [dataTypeFilters, activeQuery]);

    const fieldsEmptyMsg = useMemo(() => {
        return `Select a ${
            entityDataType.nounAsParentSingular?.toLowerCase() ?? entityDataType.nounSingular?.toLowerCase()
        }.`;
    }, [entityDataType]);

    const activeQueryLabel = useMemo(() => {
        if (!entityQueries || !activeQuery) return null;
        return entityQueries.find(query => query?.value?.toLowerCase() === activeQuery.toLowerCase())?.label;
    }, [entityQueries, activeQuery]);

    const selectDistinctOptions = useMemo((): Partial<Query.SelectDistinctOptions> => {
        if (!activeQuery || activeQuery === SAMPLE_PROPERTY_ALL_SAMPLE_TYPE.query) return null;

        if (entityDataType.nounAsParentSingular !== SamplePropertyDataType.nounAsParentSingular) return null;

        const sampleTypeLsid = entityQueries.find(
            query => query?.value?.toLowerCase() === activeQuery.toLowerCase()
        )?.lsid;
        return {
            filterArray: [Filter.create('SampleSet', sampleTypeLsid)],
        };
    }, [entityDataType, activeQuery, entityQueries]);

    const entityTypeFields = useMemo((): List<QueryColumn> => {
        if (!activeQueryInfo) return undefined;

        if (entityDataType.nounAsParentSingular !== SamplePropertyDataType.nounAsParentSingular) return undefined;

        return getSamplePropertyFields(activeQueryInfo, skipDefaultViewCheck);
    }, [activeQueryInfo, skipDefaultViewCheck, entityDataType]);

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Select Sample {capParentNoun} Properties</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{loadingError}</Alert>
                <Alert>{filterError}</Alert>
                <Row className="field-modal__container">
                    <Col xs={6} sm={3} className="field-modal__col filter-modal__col_queries">
                        <div className="field-modal__col-title">
                            {entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}
                        </div>
                        <div className="list-group field-modal__col-content">
                            {!isLoaded && <LoadingSpinner wrapperClassName="loading-spinner" />}
                            {entityQueries.map((parent, index) => {
                                const { label, value } = parent;
                                const fieldFilterCount =
                                    dataTypeFilters?.[value]?.filter(
                                        f => f.filter.getFilterType() !== NOT_ANY_FILTER_TYPE
                                    )?.length ?? 0;
                                return (
                                    <ChoicesListItem
                                        active={value === activeQuery}
                                        index={index}
                                        key={parent.rowId}
                                        label={label}
                                        onSelect={() => onEntityClick(value)}
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
                    <QueryFilterPanel
                        allowRelativeDateFilter={allowRelativeDateFilter}
                        api={api}
                        emptyMsg={fieldsEmptyMsg}
                        entityDataType={entityDataType}
                        fieldKey={fieldKey}
                        filters={dataTypeFilters}
                        metricFeatureArea={metricFeatureArea}
                        onFilterUpdate={onFilterUpdate}
                        hasNotInQueryFilter={hasNotInQueryFilter}
                        onHasNoValueInQueryChange={onHasNoValueInQueryChange}
                        queryInfo={activeQueryInfo}
                        skipDefaultViewCheck={skipDefaultViewCheck}
                        validFilterField={isValidFilterFieldExcludeLookups}
                        hasNotInQueryFilterLabel={`Find Samples without ${activeQueryLabel} results`}
                        selectDistinctOptions={selectDistinctOptions}
                        altQueryName={activeQuery}
                        fields={entityTypeFields}
                    />
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
