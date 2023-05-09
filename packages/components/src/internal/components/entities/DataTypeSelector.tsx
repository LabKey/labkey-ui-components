import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { getDataTypeDataCount } from '../project/actions';

import { DataTypeEntity, EntityDataType } from './models';

interface Props {
    allDataCounts?: { [key: string]: number };
    allDataTypes?: DataTypeEntity[]; // either use allDataTypes to pass in dataTypes, or specify entityDataType to query dataTypes
    api?: ComponentsAPIWrapper;
    dataTypeKey?: string;
    dataTypeLabel?: string;
    disabled?: boolean;
    entityDataType?: EntityDataType;
    showWarning?: boolean;
    toggleSelectAll?: boolean;

    uncheckedEntitiesDB: number[];

    updateUncheckedTypes: (dataType: string, unchecked: number[]) => void;
}

export const DataTypeSelector: FC<Props> = memo(props => {
    const {
        api,
        toggleSelectAll,
        disabled,
        entityDataType,
        allDataTypes,
        dataTypeLabel,
        showWarning,
        uncheckedEntitiesDB,
        allDataCounts,
        updateUncheckedTypes,
    } = props;

    const [dataTypes, setDataTypes] = useState<DataTypeEntity[]>(undefined);
    const [dataType, setDataType] = useState<string>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [dataCounts, setDataCounts] = useState<{ [key: string]: number }>(null);
    const [uncheckedEntities, setUncheckedEntities] = useState<number[]>(undefined);

    useEffect(() => {
        if (allDataTypes) setDataTypes(allDataTypes);
        else loadDataTypes(); // use entitydatatype

        if (allDataCounts) setDataCounts(dataCounts);

        setDataType(dataType ?? entityDataType?.projectConfigurableDataType);

        setUncheckedEntities(uncheckedEntitiesDB ?? []);
    }, [api.query, dataType, entityDataType, allDataTypes, allDataCounts, uncheckedEntitiesDB]);

    const loadDataTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);

            const results = await api.query.getProjectConfigurableEntityTypeOptions(entityDataType);
            setDataTypes(results);

            // set uncheckedEntitiesDB
        } catch (e) {
            console.error(e);
            setError(resolveErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [api.query, entityDataType, allDataTypes]);

    const ensureCount = useCallback(async () => {
        if (dataCounts || !showWarning) return;

        const results = await getDataTypeDataCount(entityDataType.projectConfigurableDataType, dataTypes);
        setDataCounts(results);
    }, [dataCounts, showWarning, dataTypes, entityDataType]);

    const onChange = useCallback(
        (entityRowId: number, checked: boolean) => {
            if (disabled) return;
            ensureCount();
            const updated = [...uncheckedEntities];
            if (checked) {
                const ind = updated.indexOf(entityRowId);
                updated.splice(ind, 1);
            } else {
                updated.push(entityRowId);
            }
            updateUncheckedTypes(dataType, updated);
            setUncheckedEntities(updated);
        },
        [disabled, uncheckedEntities, dataType, uncheckedEntitiesDB, dataTypes]
    );

    const allSelected = useMemo(() => {
        return uncheckedEntities === null || uncheckedEntities?.length === 0;
    }, [uncheckedEntities]);

    const onSelectAll = useCallback(() => {
        if (allSelected) {
            ensureCount();
            const rowIds = dataTypes.map(type => type.rowId);
            updateUncheckedTypes(dataType, rowIds);
            setUncheckedEntities(rowIds);
        } else {
            updateUncheckedTypes(dataType, []);
            setUncheckedEntities([]);
        }
    }, [allSelected, dataTypes, updateUncheckedTypes, dataType]);

    const getUncheckedEntityWarning = useCallback(
        (rowId: number): React.ReactNode => {
            if (!showWarning) return null;

            if (uncheckedEntitiesDB?.indexOf(rowId) > -1) return null;

            if (uncheckedEntities?.indexOf(rowId) > -1) {
                if (!dataCounts) return <LoadingSpinner />;

                if (!dataCounts[rowId + '']) return null;

                const dataCount = dataCounts[rowId + ''];
                return (
                    <Alert bsStyle="warning">
                        {dataCount} {entityDataType.nounPlural} will no longer be visible in this project. They won't be
                        deleted and lineage relationships won't change.{' '}
                    </Alert>
                );
            }

            return null;
        },
        [uncheckedEntities, uncheckedEntitiesDB, showWarning, dataCounts, entityDataType]
    );

    const headerLabel = useMemo(() => {
        if (dataTypeLabel) return dataTypeLabel;

        if (entityDataType?.typeNounSingular) return entityDataType.typeNounSingular + 's';

        return null;
    }, [dataTypeLabel, entityDataType]);

    if (!dataTypes || loading) return <LoadingSpinner />;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <div className="">
                {headerLabel && <div className="bottom-spacing">{headerLabel}</div>}
                {toggleSelectAll && !disabled && (
                    <Row>
                        <Col xs={12} className="bottom-spacing">
                            <div className="filter-clear-all" onClick={onSelectAll}>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </div>
                        </Col>
                    </Row>
                )}
                <Row>
                    <Col xs={12}>
                        {loading && <LoadingSpinner />}
                        {!loading && (
                            <ul className="nav nav-stacked labkey-wizard-pills">
                                {dataTypes?.map((dataType, index) => {
                                    return (
                                        <li key={index} className="filter-faceted__li">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input filter-faceted__checkbox"
                                                    type="checkbox"
                                                    name={'field-value-' + index}
                                                    onChange={event => onChange(dataType.rowId, event.target.checked)}
                                                    checked={uncheckedEntities?.indexOf(dataType.rowId) < 0}
                                                    disabled={disabled}
                                                />
                                                <div
                                                    className="filter-faceted__value"
                                                    onClick={() => onChange(dataType.rowId, true)}
                                                >
                                                    {dataType.label}
                                                </div>
                                            </div>
                                            {!!dataType.description && (
                                                <div className="help-block">{dataType.description}</div>
                                            )}
                                            {getUncheckedEntityWarning(dataType.rowId)}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Col>
                </Row>
            </div>
        </>
    );
});

DataTypeSelector.defaultProps = {
    toggleSelectAll: true,
    api: getDefaultAPIWrapper(),
};
