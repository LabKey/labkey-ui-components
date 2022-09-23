import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { EntityDataType, IEntityTypeOption } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { Alert } from '../base/Alert';

import { resolveErrorMessage } from '../../util/messaging';

import { naturalSortByProperty } from '../../../public/sort';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { FieldFilter, FilterProps } from './models';
import {
    getFieldFiltersValidationResult,
    getUpdatedDataTypeFilters,
    isValidFilterFieldExcludeLookups,
} from './utils';
import { QueryFilterPanel } from './QueryFilterPanel';
import {AssayResultDataType} from "../entities/constants";

interface Props {
    api?: ComponentsAPIWrapper;
    assaySampleIdCols?: {[key: string] : string};
    entityDataType: EntityDataType;
    onCancel: () => void;
    onFind: (
        entityDataType: EntityDataType,
        dataTypeFilters: { [key: string]: FieldFilter[] },
        queryLabels: { [key: string]: string }
    ) => void;
    queryName?: string;
    fieldKey?: string;
    cards?: FilterProps[];
    skipDefaultViewCheck?: boolean; // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
    metricFeatureArea?: string;
    setCardDirty?: (dirty: boolean) => any;
}

export const EntityFieldFilterModal: FC<Props> = memo(props => {
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

    const capParentNoun = capitalizeFirstChar(entityDataType.nounAsParentSingular);

    const [entityQueries, setEntityQueries] = useState<IEntityTypeOption[]>(undefined);
    const [activeQuery, setActiveQuery] = useState<string>(undefined);
    const [activeQueryInfo, setActiveQueryInfo] = useState<QueryInfo>(undefined);
    const [loadingError, setLoadingError] = useState<string>(undefined);
    const [filterError, setFilterError] = useState<string>(undefined);

    // key is the parent query name
    const [dataTypeFilters, setDataTypeFilters] = useState<{ [key: string]: FieldFilter[] }>({});

    const onEntityClick = useCallback(
        async (selectedQueryName: string) => {
            try {
                let schemaName = entityDataType.instanceSchemaName;
                let queryName = selectedQueryName;
                if (!schemaName && entityDataType.getInstanceSchemaQuery) {
                    const schemaQuery = entityDataType.getInstanceSchemaQuery(selectedQueryName);
                    schemaName = schemaQuery.schemaName;
                    queryName = schemaQuery.queryName;
                }
                const queryInfo = await api.query.getQueryDetails({
                    schemaName: schemaName,
                    queryName: queryName,
                });
                setActiveQuery(selectedQueryName);
                setActiveQueryInfo(queryInfo);
                setLoadingError(undefined);
            } catch (error) {
                setLoadingError(resolveErrorMessage(error, selectedQueryName, selectedQueryName, 'load'));
            }
        },
        [api, entityDataType.instanceSchemaName, entityDataType.getInstanceSchemaQuery]
    );

    useEffect(() => {
        const activeDataTypeFilters = {};

        cards?.forEach(card => {
            if (card.entityDataType.instanceSchemaName !== entityDataType.instanceSchemaName) return;
            const parent = card.schemaQuery.queryName.toLowerCase();
            activeDataTypeFilters[parent] = card.filterArray;
        });
        setDataTypeFilters(activeDataTypeFilters);

        setLoadingError(undefined);
        api.query
            .getEntityTypeOptions(entityDataType)
            .then(results => {
                // filter assays
                const parents = [];
                results.map(result => {
                    let shouldInclude = true;
                    if (entityDataType.typeListingSchemaQuery === AssayResultDataType.typeListingSchemaQuery) {
                        let hasSampleIdCol = false;
                        result.forEach(assay => {
                            if (!hasSampleIdCol && assaySampleIdCols?.[assay.value]) {
                                hasSampleIdCol = true;
                            }
                        });
                        shouldInclude = hasSampleIdCol;
                    }

                    if (shouldInclude) {
                        result.map(res => {
                            parents.push(res);
                        });
                    };

                });
                setEntityQueries(parents.sort(naturalSortByProperty('label')));
                if (queryName) {
                    onEntityClick(queryName);
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
        entityQueries?.forEach(parent => {
            const label = parent.label ?? parent.get?.('label');
            const parentValue = parent.value ?? parent.get?.('value');
            queryLabels[parentValue] = label;
        });
        const filterErrors = getFieldFiltersValidationResult(validDataTypeFilters, queryLabels);
        if (!filterErrors) {
            onFind(entityDataType, validDataTypeFilters, queryLabels);
        } else {
            setFilterError(filterErrors);
            api.query.incrementClientSideMetricCount(metricFeatureArea, 'filterModalError');
        }
    }, [api, metricFeatureArea, entityQueries, entityDataType, onFind, validDataTypeFilters]);

    const onFilterUpdate = useCallback(
        (field: QueryColumn, newFilters: Filter.IFilter[], index: number) => {
            setCardDirty?.(true);
            setFilterError(undefined);
            setDataTypeFilters(getUpdatedDataTypeFilters(dataTypeFilters, activeQuery, field, newFilters));
        },
        [dataTypeFilters, activeQuery]
    );

    const fieldsEmptyMsg = useMemo(() => {
        return `Select a ${
            entityDataType.nounAsParentSingular?.toLowerCase() ?? entityDataType.nounSingular?.toLowerCase()
        }.`;
    }, [entityDataType]);

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
                            {!entityQueries && <LoadingSpinner wrapperClassName="loading-spinner" />}
                            {entityQueries?.map((parent, index) => {
                                const label = parent.label ?? parent.get?.('label'); // jest test data is Map, instead of js object
                                const parentValue = parent.value ?? parent.get?.('value');
                                const fieldFilterCount =
                                    dataTypeFilters?.[parentValue]?.filter(
                                        f => f.filter.getFilterType() !== NOT_ANY_FILTER_TYPE
                                    )?.length ?? 0;
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
                    <QueryFilterPanel
                        api={api}
                        emptyMsg={fieldsEmptyMsg}
                        entityDataType={entityDataType}
                        fieldKey={fieldKey}
                        filters={dataTypeFilters}
                        metricFeatureArea={metricFeatureArea}
                        onFilterUpdate={onFilterUpdate}
                        queryInfo={activeQueryInfo}
                        skipDefaultViewCheck={skipDefaultViewCheck}
                        validFilterField={isValidFilterFieldExcludeLookups}
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
