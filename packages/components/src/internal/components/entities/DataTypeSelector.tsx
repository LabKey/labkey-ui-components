import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ColorIcon } from '../base/ColorIcon';
import { Tip } from '../base/Tip';

import { DataTypeEntity, EntityDataType, ProjectConfigurableDataType } from './models';

interface Props {
    allDataCounts?: Record<string, number>;
    allDataTypes?: DataTypeEntity[]; // either use allDataTypes to pass in dataTypes, or specify entityDataType to query dataTypes
    api?: ComponentsAPIWrapper;
    columns?: number; // partition list to N columns
    dataTypeKey?: string;
    dataTypeLabel?: string;
    dataTypePrefix?: string;
    disabled?: boolean;
    entityDataType?: EntityDataType;
    isNewFolder?: boolean;
    noHeader?: boolean;
    showUncheckedWarning?: boolean;
    toggleSelectAll?: boolean;
    uncheckedEntitiesDB: any[]; // number[] | string[]
    updateUncheckedTypes: (dataType: string, unchecked: any[] /* number[] | string[]*/) => void;
}

export const getUncheckedEntityWarning = (
    uncheckedEntities: any[], // number[] | string[]
    uncheckedEntitiesDB: any[], // number[] | string[]
    dataCounts: Record<string, number>,
    entityDataType: EntityDataType,
    rowId: number | string
): React.ReactNode => {
    if (uncheckedEntitiesDB?.indexOf(rowId) > -1) return null;

    if (uncheckedEntities?.indexOf(rowId) > -1) {
        if (!dataCounts) return <LoadingSpinner />;

        if (!dataCounts[rowId + '']) return null;

        const dataCount = dataCounts[rowId + ''];
        const nounPlural = entityDataType?.nounPlural?.toLowerCase() ?? 'samples';
        const nounSingular = entityDataType?.nounSingular?.toLowerCase() ?? 'sample';
        return (
            <Alert bsStyle="warning" className="margin-left-more">
                {dataCount} {dataCount > 1 ? nounPlural : nounSingular} will no longer be visible in this project. They
                won't be deleted and lineage relationships won't change.{' '}
            </Alert>
        );
    }

    return null;
};

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
        noHeader,
        isNewFolder,
        showUncheckedWarning = true,
        dataTypePrefix = '',
    } = props;

    const [dataTypes, setDataTypes] = useState<DataTypeEntity[]>(undefined);
    const [dataType, setDataType] = useState<ProjectConfigurableDataType>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataCounts, setDataCounts] = useState<Record<string, number>>(undefined);
    const [uncheckedEntities, setUncheckedEntities] = useState<any[] /* number[] | string[]*/>(undefined);

    const loadDataTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);

            const results = await api.query.getProjectConfigurableEntityTypeOptions(entityDataType);
            setDataTypes(results);
        } catch (e) {
            console.error(e);
            setError(resolveErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [api, entityDataType]);

    useEffect(() => {
        if (allDataCounts) setDataCounts(allDataCounts);

        if (allDataTypes) setDataTypes(allDataTypes);
        else if (entityDataType) loadDataTypes(); // use entitydatatype

        setDataType((dataTypePrefix + entityDataType?.projectConfigurableDataType) as ProjectConfigurableDataType);

        setUncheckedEntities(uncheckedEntitiesDB ?? []);
    }, [entityDataType, allDataTypes, allDataCounts, uncheckedEntitiesDB, dataTypePrefix, loadDataTypes]); // include transitive dependency

    const ensureCount = useCallback(async () => {
        if (dataCounts) return;

        const results = await api.query.getProjectDataTypeDataCount(dataType, dataTypes, isNewFolder);
        setDataCounts(results);
    }, [api, dataCounts, dataTypes, isNewFolder, dataType]);

    const onChange = useCallback(
        (entityId: number | string, toggle: boolean, check?: boolean) => {
            if (disabled) return;
            ensureCount();
            const updated = [...uncheckedEntities];
            let checked = check;
            if (toggle) {
                checked = uncheckedEntities?.indexOf(entityId) > -1;
            }

            if (checked) {
                const ind = updated.indexOf(entityId);
                updated.splice(ind, 1);
            } else {
                updated.push(entityId);
            }

            updateUncheckedTypes(dataType, updated);
            setUncheckedEntities(updated);
        },
        [disabled, uncheckedEntities, dataType, ensureCount]
    );

    const allSelected = useMemo(() => {
        return uncheckedEntities === null || uncheckedEntities?.length === 0;
    }, [uncheckedEntities]);

    const onSelectAll = useCallback(() => {
        if (allSelected) {
            ensureCount();
            const ids = dataTypes.map(type => type.rowId ?? type.lsid);
            updateUncheckedTypes(dataType, ids);
            setUncheckedEntities(ids);
        } else {
            updateUncheckedTypes(dataType, []);
            setUncheckedEntities([]);
        }
    }, [allSelected, dataTypes, updateUncheckedTypes, dataType, ensureCount]);

    const _getUncheckedEntityWarning = useCallback(
        (id: number | string): React.ReactNode => {
            return getUncheckedEntityWarning(uncheckedEntities, uncheckedEntitiesDB, dataCounts, entityDataType, id);
        },
        [uncheckedEntities, uncheckedEntitiesDB, dataCounts, entityDataType]
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
                        const entityId = dataType.rowId ?? dataType.lsid;
                        return (
                            <li key={entityId} className="project-faceted__li">
                                <div className="form-check">
                                    <input
                                        className="form-check-input filter-faceted__checkbox"
                                        type="checkbox"
                                        name={'field-value-' + index}
                                        onChange={event => onChange(entityId, false, event.target.checked)}
                                        checked={uncheckedEntities?.indexOf(entityId) < 0}
                                        disabled={disabled}
                                    />
                                    <div
                                        className="margin-left-more project-datatype-faceted__value"
                                        onClick={() => onChange(entityId, true)}
                                    >
                                        {dataType.labelColor && (
                                            <ColorIcon
                                                cls="label_color color-icon__circle-small"
                                                value={dataType.labelColor}
                                            />
                                        )}
                                        {dataType.label}
                                    </div>
                                </div>
                                {!!dataType.sublabel && (
                                    <div className="help-block margin-left-more">{dataType.sublabel}</div>
                                )}
                                {!!dataType.description && (
                                    <>
                                        {dataType.description.length > 30 && (
                                            <Tip caption={dataType.description}>
                                                <div className="help-block margin-left-more short_description">
                                                    {dataType.description}
                                                </div>
                                            </Tip>
                                        )}
                                        {dataType.description.length <= 30 && (
                                            <div className="help-block margin-left-more short_description">
                                                {dataType.description}
                                            </div>
                                        )}
                                    </>
                                )}
                                {showUncheckedWarning && _getUncheckedEntityWarning(entityId)}
                            </li>
                        );
                    })}
                </ul>
            );
        },
        [uncheckedEntities, onChange, disabled, _getUncheckedEntityWarning]
    );

    const getEntitiesList = useCallback((): React.ReactNode => {
        if (!columns || columns === 1) {
            return <div className="col-xs-12">{getEntitiesSubList(dataTypes)}</div>;
        }

        const lists = [];
        const colWidth = 12 / columns;
        const subSize = Math.ceil(dataTypes.length / columns);
        for (let i = 0; i < columns; i++) {
            const maxInd = Math.min(dataTypes.length, (i + 1) * subSize);
            const subList = dataTypes.slice(i * subSize, maxInd);
            lists.push(
                <div className={`col-xs-12 col-md-${colWidth}`} key={i}>
                    {getEntitiesSubList(subList)}
                </div>
            );
        }
        return <>{lists}</>;
    }, [dataTypes, columns, getEntitiesSubList]);

    if (!dataTypes || loading) return <LoadingSpinner />;

    return (
        <>
            <Alert>{error}</Alert>
            <div className="">
                {headerLabel && !noHeader && <div className="bottom-spacing content-group-label">{headerLabel}</div>}
                {toggleSelectAll && !disabled && dataTypes?.length > 0 && (
                    <div className="row">
                        <div className="col-xs-12 bottom-spacing">
                            <div className="clickable-text" onClick={onSelectAll}>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </div>
                        </div>
                    </div>
                )}
                <div className="row">
                    {loading && <LoadingSpinner/>}
                    {!loading && getEntitiesList()}
                    {!loading && dataTypes.length === 0 && (
                        <div className="help-block margin-left-more">No {headerLabel}</div>
                    )}
                </div>
            </div>
        </>
    );
});

DataTypeSelector.defaultProps = {
    toggleSelectAll: true,
    api: getDefaultAPIWrapper(),
};
