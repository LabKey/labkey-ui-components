import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { getDataTypeDataCount } from '../project/actions';

import { ColorIcon } from '../base/ColorIcon';
import { Tip } from '../base/Tip';

import { DataTypeEntity, EntityDataType, ProjectConfigurableDataType } from './models';

interface Props {
    allDataCounts?: { [key: string]: number };
    allDataTypes?: DataTypeEntity[]; // either use allDataTypes to pass in dataTypes, or specify entityDataType to query dataTypes
    api?: ComponentsAPIWrapper;
    columns?: number;
    dataTypeKey?: string;
    dataTypeLabel?: string;
    disabled?: boolean;
    entityDataType?: EntityDataType;
    toggleSelectAll?: boolean; // partition list to N columns

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
        uncheckedEntitiesDB,
        allDataCounts,
        updateUncheckedTypes,
        columns,
    } = props;

    const [dataTypes, setDataTypes] = useState<DataTypeEntity[]>(undefined);
    const [dataType, setDataType] = useState<ProjectConfigurableDataType>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataCounts, setDataCounts] = useState<{ [key: string]: number }>(null);
    const [uncheckedEntities, setUncheckedEntities] = useState<number[]>(undefined);

    useEffect(() => {
        if (allDataCounts) setDataCounts(allDataCounts);

        if (allDataTypes) setDataTypes(allDataTypes);
        else if (entityDataType) loadDataTypes(); // use entitydatatype

        setDataType(entityDataType?.projectConfigurableDataType);

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
        if (dataCounts) return;

        const results = await getDataTypeDataCount(entityDataType.projectConfigurableDataType, dataTypes);
        setDataCounts(results);
    }, [dataCounts, dataTypes, entityDataType, allDataTypes]);

    const onChange = useCallback(
        (entityRowId: number, toggle: boolean, check?: boolean) => {
            if (disabled) return;
            ensureCount();
            const updated = [...uncheckedEntities];
            let checked = check;
            if (toggle) {
                checked = uncheckedEntities?.indexOf(entityRowId) > -1;
            }

            if (checked) {
                const ind = updated.indexOf(entityRowId);
                updated.splice(ind, 1);
            } else {
                updated.push(entityRowId);
            }

            updateUncheckedTypes(dataType, updated);
            setUncheckedEntities(updated);
        },
        [disabled, uncheckedEntities, dataType, uncheckedEntitiesDB, dataTypes, dataCounts]
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
    }, [allSelected, dataTypes, updateUncheckedTypes, dataType, dataCounts]);

    const getUncheckedEntityWarning = useCallback(
        (rowId: number): React.ReactNode => {
            if (uncheckedEntitiesDB?.indexOf(rowId) > -1) return null;

            if (uncheckedEntities?.indexOf(rowId) > -1) {
                if (!dataCounts) return <LoadingSpinner />;

                if (!dataCounts[rowId + '']) return null;

                const dataCount = dataCounts[rowId + ''];
                const nounPlural = entityDataType?.nounPlural?.toLowerCase() ?? 'samples';
                const nounSingular = entityDataType?.nounSingular?.toLowerCase() ?? 'sample';
                return (
                    <Alert bsStyle="warning" className="left-margin">
                        {dataCount} {dataCount > 1 ? nounPlural : nounSingular} will no longer be visible in this
                        project. They won't be deleted and lineage relationships won't change.{' '}
                    </Alert>
                );
            }

            return null;
        },
        [uncheckedEntities, uncheckedEntitiesDB, dataCounts, entityDataType, dataTypes]
    );

    const headerLabel = useMemo(() => {
        if (dataTypeLabel) return dataTypeLabel;

        if (entityDataType?.typeNounSingular) return entityDataType.typeNounSingular + 's';

        return null;
    }, [dataTypeLabel, entityDataType]);

    const getEntitiesSubList = useCallback(
        (dataTypeEntities: DataTypeEntity[]): React.ReactNode => {
            return (
                <ul className="nav nav-stacked labkey-wizard-pills">
                    {dataTypeEntities?.map((dataType, index) => {
                        return (
                            <li key={dataType.rowId} className="project-faceted__li">
                                <div className="form-check">
                                    <input
                                        className="form-check-input filter-faceted__checkbox"
                                        type="checkbox"
                                        name={'field-value-' + index}
                                        onChange={event => onChange(dataType.rowId, false, event.target.checked)}
                                        checked={uncheckedEntities?.indexOf(dataType.rowId) < 0}
                                        disabled={disabled}
                                    />
                                    <div
                                        className="left-margin project-datatype-faceted__value"
                                        onClick={() => onChange(dataType.rowId, true)}
                                    >
                                        {dataType.labelcolor && (
                                            <ColorIcon
                                                cls="label_color color-icon__circle-small"
                                                value={dataType.labelcolor}
                                            />
                                        )}
                                        {dataType.label}
                                    </div>
                                </div>
                                {!!dataType.sublabel && (
                                    <div className="help-block left-margin">{dataType.sublabel}</div>
                                )}
                                {!!dataType.description && (
                                    <Tip caption={dataType.description}>
                                        <div className="help-block left-margin short_description">
                                            {dataType.description}
                                        </div>
                                    </Tip>
                                )}
                                {getUncheckedEntityWarning(dataType.rowId)}
                            </li>
                        );
                    })}
                </ul>
            );
        },
        [uncheckedEntities, uncheckedEntitiesDB, dataCounts, entityDataType, dataTypes]
    );

    const getEntitiesList = useCallback((): React.ReactNode => {
        if (!columns || columns === 1) {
            return <Col xs={12}>{getEntitiesSubList(dataTypes)}</Col>;
        }

        const lists = [];
        const colWidth = 12 / columns;
        const subSize = Math.ceil(dataTypes.length / columns);
        for (let i = 0; i < columns; i++) {
            const maxInd = Math.min(dataTypes.length, (i + 1) * subSize);
            const subList = dataTypes.slice(i * subSize, maxInd);
            lists.push(
                <Col xs={12} md={colWidth} key={i}>
                    {getEntitiesSubList(subList)}
                </Col>
            );
        }
        return <>{lists}</>;
    }, [uncheckedEntities, uncheckedEntitiesDB, dataCounts, entityDataType, dataTypes, columns]);

    if (!dataTypes || loading) return <LoadingSpinner />;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <div className="">
                {headerLabel && <div className="bottom-spacing content-group-label">{headerLabel}</div>}
                {toggleSelectAll && !disabled && dataTypes?.length > 0 && (
                    <Row>
                        <Col xs={12} className="bottom-spacing">
                            <div className="filter-clear-all" onClick={onSelectAll}>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </div>
                        </Col>
                    </Row>
                )}
                <Row>
                    {loading && <LoadingSpinner />}
                    {!loading && getEntitiesList()}
                    {!loading && dataTypes.length === 0 && <div className="help-block">No {headerLabel}</div>}
                </Row>
            </div>
        </>
    );
});

DataTypeSelector.defaultProps = {
    toggleSelectAll: true,
    api: getDefaultAPIWrapper(),
};
