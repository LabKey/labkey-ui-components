import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ColorIcon } from '../base/ColorIcon';

import { Container } from '../base/models/Container';

import { ExpandableContainer } from '../ExpandableContainer';

import { DataTypeEntity, EntityDataType, FolderConfigurableDataType } from './models';

export const filterDataTypeHiddenEntity = (dataType: DataTypeEntity, hiddenEntities?: any[]): boolean => {
    return !hiddenEntities || hiddenEntities?.indexOf(dataType.rowId ?? dataType.lsid) === -1;
};

export interface DataTypeSelectorProps {
    allDataCounts?: Record<string, number>;
    allDataTypes?: DataTypeEntity[]; // either use allDataTypes to pass in dataTypes, or specify entityDataType to query dataTypes
    api?: ComponentsAPIWrapper;
    columns?: number; // partition list to N columns
    container?: Container;
    dataTypeKey?: string;
    dataTypeLabel?: string;
    dataTypePrefix?: string;
    disabled?: boolean;
    entityDataType?: EntityDataType;
    hiddenEntities?: any[]; // number[] | string[]
    inactiveSectionLabel?: string;
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
                {dataCount} {dataCount > 1 ? nounPlural : nounSingular} will no longer be visible in this folder. They
                won't be deleted and lineage relationships won't change.{' '}
            </Alert>
        );
    }

    return null;
};

interface DataTypeSelectorListProps {
    columns?: number;
    dataType?: DataTypeEntity;
    dataTypes?: DataTypeEntity[];
    disabled: boolean;
    getUncheckedEntityWarning?: (id: number | string) => React.ReactNode;
    index?: number;
    onChange: (entityId: number | string, toggle: boolean, check?: boolean) => void;
    showUncheckedWarning: boolean;
    uncheckedEntities: any[];
}

export const DataTypeSelectorItem: FC<DataTypeSelectorListProps> = memo(props => {
    const { index, disabled, getUncheckedEntityWarning, uncheckedEntities, onChange, showUncheckedWarning, dataType } =
        props;

    const entityId = useMemo(() => {
        return dataType.rowId ?? dataType.lsid;
    }, [dataType]);

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChange(entityId, false, event.target.checked);
        },
        [entityId]
    );

    const handleClick = useCallback(
        (event: any) => {
            onChange(entityId, true);
        },
        [entityId]
    );

    return (
        <li key={entityId} className="folder-faceted-data-type">
            <div className="form-check">
                <input
                    className="form-check-input filter-faceted__checkbox"
                    type="checkbox"
                    name={'field-value-' + index}
                    onChange={handleChange}
                    checked={uncheckedEntities?.indexOf(entityId) < 0}
                    disabled={disabled}
                />
                <div className="margin-left-more folder-datatype-faceted__value" onClick={handleClick}>
                    {dataType.labelColor && (
                        <ColorIcon cls="label_color color-icon__circle-small" value={dataType.labelColor} />
                    )}
                    {dataType.label}
                </div>
            </div>
            {!!dataType.sublabel && <div className="help-block margin-left-more">{dataType.sublabel}</div>}
            {showUncheckedWarning && getUncheckedEntityWarning(entityId)}
        </li>
    );
});

export const DataTypeSelectorList: FC<DataTypeSelectorListProps> = memo(props => {
    const {
        columns = 1,
        dataTypes,
        disabled,
        getUncheckedEntityWarning,
        uncheckedEntities,
        onChange,
        showUncheckedWarning,
    } = props;

    const colWidth = 12 / columns;
    const subSize = Math.ceil(dataTypes.length / columns);
    const columnIndexes = [];
    for (let i = 0; i < columns; i++) columnIndexes.push(i);

    return (
        <>
            {columnIndexes.map(ind => {
                const maxInd = Math.min(dataTypes.length, (ind + 1) * subSize);
                const subList = dataTypes.slice(ind * subSize, maxInd);
                return (
                    <div className={`col-xs-12 col-md-${colWidth}`} key={ind}>
                        <ul className="nav nav-stacked labkey-wizard-pills">
                            {subList?.map((type, index) => {
                                return (
                                    <DataTypeSelectorItem
                                        index={index}
                                        dataType={type}
                                        disabled={disabled}
                                        getUncheckedEntityWarning={getUncheckedEntityWarning}
                                        uncheckedEntities={uncheckedEntities}
                                        onChange={onChange}
                                        showUncheckedWarning={showUncheckedWarning}
                                    />
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </>
    );
});

export const DataTypeSelector: FC<DataTypeSelectorProps> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        toggleSelectAll = true,
        disabled,
        entityDataType,
        allDataTypes,
        dataTypeLabel,
        hiddenEntities,
        uncheckedEntitiesDB,
        allDataCounts,
        updateUncheckedTypes,
        columns,
        noHeader,
        isNewFolder,
        container,
        showUncheckedWarning = true,
        dataTypePrefix = '',
        inactiveSectionLabel = 'Inactive',
    } = props;

    const [dataTypes, setDataTypes] = useState<DataTypeEntity[]>();
    const [dataType, setDataType] = useState<FolderConfigurableDataType>();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [dataCounts, setDataCounts] = useState<Record<string, number>>();
    const [uncheckedEntities, setUncheckedEntities] = useState<any[] /* number[] | string[]*/>();

    const loadDataTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);

            const results = await api.query.getFolderConfigurableEntityTypeOptions(entityDataType, container?.path);

            // the Dashboard related data type exclusions should hide entities from the parent/related exclusion
            const results_ = results?.filter(type => filterDataTypeHiddenEntity(type, hiddenEntities));

            setDataTypes(results_);
        } catch (e) {
            console.error(e);
            setError(resolveErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [api.query, entityDataType, hiddenEntities, container?.path]);

    useEffect(() => {
        if (dataTypes !== undefined && allDataTypes) {
            setDataTypes(allDataTypes.filter(type => filterDataTypeHiddenEntity(type, hiddenEntities)));
        }
    }, [hiddenEntities /* only called on changes to hiddenEntities */]);

    useEffect(
        () => {
            if (allDataCounts) setDataCounts(allDataCounts);

            if (allDataTypes)
                setDataTypes(allDataTypes.filter(type => filterDataTypeHiddenEntity(type, hiddenEntities)));
            else if (entityDataType) loadDataTypes(); // use entitydatatype

            setDataType((dataTypePrefix + entityDataType?.folderConfigurableDataType) as FolderConfigurableDataType);

            setUncheckedEntities(uncheckedEntitiesDB ?? []);
        },
        [
            /* mount only */
        ]
    );

    const ensureCount = useCallback(async () => {
        if (dataCounts) return;

        const results = await api.query.getFolderDataTypeDataCount(dataType, container?.path, dataTypes, isNewFolder);
        setDataCounts(results);
    }, [api.query, dataCounts, dataType, dataTypes, isNewFolder, container?.path]);

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
        [disabled, ensureCount, uncheckedEntities, updateUncheckedTypes, dataType]
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

    const { activeDataTypes, inactiveDataTypes } = useMemo(() => {
        const activeDataTypes: DataTypeEntity[] = [],
            inactiveDataTypes: DataTypeEntity[] = [];
        if (loading) return { activeDataTypes, inactiveDataTypes };
        dataTypes?.forEach(dataType => {
            if (dataType.inactive) inactiveDataTypes.push(dataType);
            else activeDataTypes.push(dataType);
        });
        return { activeDataTypes, inactiveDataTypes };
    }, [loading, dataTypes]);

    const generateInactiveSectionHeader = useMemo(() => {
        return (
            <div className="gray-text">
                <span>{inactiveSectionLabel}</span>
            </div>
        );
    }, [inactiveSectionLabel]);

    // Note: because we return LoadingSpinner here when loading we can remove all the stuff below that renders based on
    // loading status
    if (!dataTypes || loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <Alert>{error}</Alert>
            <div>
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
                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <DataTypeSelectorList
                            columns={columns}
                            dataTypes={activeDataTypes}
                            disabled={disabled}
                            getUncheckedEntityWarning={_getUncheckedEntityWarning}
                            uncheckedEntities={uncheckedEntities}
                            onChange={onChange}
                            showUncheckedWarning={showUncheckedWarning}
                        />
                    )}
                    {!loading && activeDataTypes.length === 0 && (
                        <div className="help-block margin-left-more">No {headerLabel.toLowerCase()}</div>
                    )}
                </div>
                {inactiveDataTypes?.length > 0 && (
                    <div className="container-listing-left container-data-type-selector">
                        <ExpandableContainer
                            isExpandable={true}
                            clause={generateInactiveSectionHeader}
                            links={null}
                            noIcon={true}
                            useGreyTheme={true}
                        >
                            <DataTypeSelectorList
                                columns={columns}
                                dataTypes={inactiveDataTypes}
                                disabled={disabled}
                                getUncheckedEntityWarning={_getUncheckedEntityWarning}
                                uncheckedEntities={uncheckedEntities}
                                onChange={onChange}
                                showUncheckedWarning={showUncheckedWarning}
                            />
                        </ExpandableContainer>
                    </div>
                )}
            </div>
        </>
    );
});

DataTypeSelector.displayName = 'DataTypeSelector';
