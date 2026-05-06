import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Filter, Query } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { useRequestHandler } from '../../util/RequestHandler';

import { FolderColumnRenderer } from '../../renderers/FolderColumnRenderer';

import { useTimeout } from '../../hooks';

import {
    ALL_VALUE_DISPLAY,
    EMPTY_VALUE_DISPLAY,
    getCheckedFilterValues,
    getFilterOptionsForType,
    getUpdatedChooseValuesFilter,
} from './utils';
import { SelectInput } from '../forms/input/SelectInput';
import { QueryColumn } from '../../../public/QueryColumn';
import { resolveFilterType } from '../../../public/QueryModel/grid/actions/Filter';

const MAX_DISTINCT_FILTER_OPTIONS = 250;

interface Props {
    api?: ComponentsAPIWrapper;
    canBeBlank: boolean;
    disabled?: boolean;
    field?: QueryColumn;
    fieldFilters: Filter.IFilter[];
    fieldKey: string;
    onFieldFilterUpdate?: (newFilter: Filter.IFilter[]) => void;
    selectDistinctOptions: Query.SelectDistinctOptions;
    // show search box if number of unique values > N
    showSearchLength?: number;
}

const rendererFolderValue = (value: any): ReactNode => {
    return <FolderColumnRenderer data={value} />;
};

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        canBeBlank,
        disabled,
        selectDistinctOptions,
        fieldKey,
        fieldFilters,
        onFieldFilterUpdate,
        field,
        showSearchLength = 20,
    } = props;

    const [fieldDistinctValues, setFieldDistinctValues] = useState<string[]>(undefined);
    const [searchDistinctValues, setSearchDistinctValues] = useState<string[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [searchStr, setSearchStr] = useState<string>(undefined);
    const [allShown, setAllShown] = useState<boolean>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [isFolderField, setIsFolderField] = useState<boolean>(false);
    const timer = useTimeout();
    const { requestHandler, resetRequestHandler } = useRequestHandler();

    useEffect(() => {
        setDistinctValues(true);
        const fieldKeyLc = fieldKey.toLowerCase();
        if (
            fieldKeyLc === 'folder' ||
            fieldKeyLc === 'folder/displayname' ||
            fieldKeyLc === 'container' ||
            fieldKeyLc === 'container/displayname'
        ) {
            setIsFolderField(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only on fieldKey change, reload selection values
    }, [fieldKey]);

    const multiChoices = field?.isMultiChoice ? field.validValues : null;

    const filterOptions = useMemo(() => {
        return field?.isMultiChoice ? getFilterOptionsForType(field, false) : null;
    }, [field]);

    const setDistinctValues = useCallback(
        async (checkForAll: boolean, searchStr?: string) => {
            let aborted = false;
            try {
                setLoading(true);
                setError(undefined);
                timer.clear();

                let allValues: any[] = [];
                if (!multiChoices) {
                    const filterArray = selectDistinctOptions?.filterArray ?? [];
                    if (searchStr) filterArray.push(Filter.create(fieldKey, searchStr, Filter.Types.CONTAINS));

                    // if multi value, get all options
                    const result = await api.query.selectDistinctRows({
                        ...selectDistinctOptions,
                        filterArray,
                        maxRows: MAX_DISTINCT_FILTER_OPTIONS + 1,
                        requestHandler,
                    });
                    resetRequestHandler();
                    allValues = result.values;
                } else {
                    allValues = multiChoices;
                    if (searchStr) {
                        // filter multiChoices based on search string
                        allValues = allValues.filter(val => {
                            if (val === null || val === undefined) {
                                return EMPTY_VALUE_DISPLAY.includes(searchStr);
                            }
                            return val.toString().toLowerCase().includes(searchStr.toLowerCase());
                        });
                    }
                }

                const toShow = allValues.slice(0, MAX_DISTINCT_FILTER_OPTIONS);
                const distinctValues = toShow.sort(naturalSort).map(val => {
                    if (val === '' || val === null || val === undefined) return EMPTY_VALUE_DISPLAY;
                    return val;
                });

                let hasBlank = false;
                // move [blank] to first
                if (distinctValues.indexOf(EMPTY_VALUE_DISPLAY) >= 0) {
                    hasBlank = true;
                    distinctValues.splice(distinctValues.indexOf(EMPTY_VALUE_DISPLAY), 1);
                }
                // Issue 47544: don't show 'blank' if we have all the values and none are blank
                if (toShow.length > 0 && (hasBlank || (canBeBlank && allValues.length > MAX_DISTINCT_FILTER_OPTIONS))) {
                    distinctValues.unshift(EMPTY_VALUE_DISPLAY);
                }

                // add [All] to first if the total distinct values is < 250
                const hasAllValues = !searchStr && allValues.length <= MAX_DISTINCT_FILTER_OPTIONS;
                if (hasAllValues) distinctValues.unshift(ALL_VALUE_DISPLAY);
                if (checkForAll) {
                    setAllShown(hasAllValues);
                }

                if (searchStr) {
                    setSearchDistinctValues(distinctValues);
                } else {
                    setFieldDistinctValues(distinctValues);
                }
            } catch (e) {
                aborted = !e.status;
                if (!aborted) {
                    console.error(e);
                    setAllShown(true);
                    if (searchStr) {
                        setSearchDistinctValues([]);
                    } else {
                        setFieldDistinctValues([]);
                    }
                    setError(resolveErrorMessage(e));
                }
            } finally {
                if (!aborted) {
                    timer.clear();
                    setLoading(false);
                }
            }
        },
        [
            api.query,
            canBeBlank,
            fieldKey,
            requestHandler,
            resetRequestHandler,
            selectDistinctOptions,
            timer,
            multiChoices,
        ]
    );

    const setDistinctValuesForSearch = useCallback(
        (input?: string) => {
            timer.set(() => {
                setDistinctValues(false, input);
            }, 500);
        },
        [setDistinctValues, timer]
    );

    const checkedValues = useMemo(() => {
        return getCheckedFilterValues(fieldFilters?.[0], allShown ? fieldDistinctValues : undefined, multiChoices);
    }, [fieldFilters?.[0], fieldKey, fieldDistinctValues, allShown, multiChoices]); // need to add fieldKey

    const taggedValues = useMemo(() => {
        if (checkedValues?.indexOf(ALL_VALUE_DISPLAY) > -1) return [];
        return checkedValues;
    }, [checkedValues]);

    const onSearchStrChange = useCallback(
        e => {
            setSearchStr(e.target.value);
            setDistinctValuesForSearch(e.target.value);
        },
        [setDistinctValuesForSearch]
    );

    const onChange = useCallback(
        (value: string, checked: boolean, uncheckOthers?: boolean) => {
            if (disabled) return;

            let oldFilter = fieldFilters?.[0]; // choose values applies only to the first filter
            if (!oldFilter && multiChoices) oldFilter = Filter.create(fieldKey, [], Filter.Types.ARRAY_CONTAINS_ALL);

            const newFilter = getUpdatedChooseValuesFilter(
                allShown ? fieldDistinctValues : undefined,
                fieldKey,
                value,
                checked,
                oldFilter,
                uncheckOthers
            );
            onFieldFilterUpdate([newFilter]);
        },
        [disabled, allShown, fieldDistinctValues, fieldKey, fieldFilters, onFieldFilterUpdate, multiChoices]
    );

    const filteredFieldDistinctValues = useMemo(() => {
        if (!searchStr) return fieldDistinctValues;

        return searchDistinctValues?.filter(val => {
            return val !== ALL_VALUE_DISPLAY && val !== EMPTY_VALUE_DISPLAY;
        });
    }, [fieldDistinctValues, searchDistinctValues, searchStr]);

    const renderValue = useCallback(
        (value: any) => {
            if (isFolderField) {
                return rendererFolderValue(value);
            }
            return value;
        },
        [isFolderField]
    );

    const onUpdateFilterType = useCallback(
        (_, filterUrlSuffix: string) => {
            let newFilters = [];
            if (filterUrlSuffix) {
                const newActiveFilterType = filterOptions.find(option => option.value === filterUrlSuffix);
                if (newActiveFilterType) {
                    const filterType = resolveFilterType(newActiveFilterType?.value, field);
                    let updatedFilterValues = fieldFilters?.[0]?.getValue();
                    const shouldClearUpdatedFilterValues =
                        updatedFilterValues && multiChoices && !filterType.isMultiValued();
                    if (shouldClearUpdatedFilterValues) updatedFilterValues = null;
                    newFilters = [Filter.create(fieldKey, updatedFilterValues, filterType)];
                }
            }

            onFieldFilterUpdate(newFilters);
        },
        [onFieldFilterUpdate, filterOptions, field, fieldFilters, fieldKey, multiChoices]
    );

    const hideOptions = useMemo(() => {
        return !!multiChoices && fieldFilters?.[0] && !fieldFilters?.[0]?.getFilterType().isDataValueRequired();
    }, [fieldFilters, multiChoices]);

    if (!fieldDistinctValues || allShown === undefined) return <LoadingSpinner />;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <div className="filter-faceted__panel">
                {multiChoices && (
                    <SelectInput
                        containerClass="form-group filter-expression__input-wrapper"
                        disabled={disabled}
                        inputClass="filter-expression__input-select"
                        key={'filter-expression-field-filter-type'}
                        name="filter-expression-field-filter-type"
                        onChange={onUpdateFilterType}
                        options={filterOptions}
                        placeholder="Select a filter type..."
                        required={true}
                        value={fieldFilters?.[0]?.getFilterType().getURLSuffix() || 'arraycontainsall'}
                    />
                )}
                {(fieldDistinctValues?.length > showSearchLength || searchStr) && (
                    <div>
                        <input
                            aria-label="Search for options"
                            className="form-control filter-faceted__typeahead-input"
                            disabled={disabled}
                            id="filter-faceted__typeahead-input"
                            onChange={onSearchStrChange}
                            placeholder="Type to filter"
                            type="text"
                            value={searchStr ?? ''}
                        />
                    </div>
                )}
                {!allShown && (
                    <div className="row">
                        <div className="col-xs-12 bottom-padding">
                            <div>
                                There are more than {MAX_DISTINCT_FILTER_OPTIONS} distinct values. Use the filter box
                                above to find additional values.
                            </div>
                        </div>
                    </div>
                )}
                <div className="row">
                    <div className={`col-xs-${taggedValues?.length > 0 ? 6 : 12}`}>
                        {loading && <LoadingSpinner />}
                        {!loading && !hideOptions && (
                            <ul className="nav nav-stacked labkey-wizard-pills">
                                {filteredFieldDistinctValues?.map((value, index) => {
                                    let displayValue = value;
                                    if (value === null || value === undefined) displayValue = '[blank]';

                                    return (
                                        <li className="filter-faceted__li" key={index}>
                                            <div className="form-check">
                                                <input
                                                    aria-label={'Select ' + displayValue}
                                                    checked={checkedValues.indexOf(value) > -1}
                                                    className="form-check-input filter-faceted__checkbox"
                                                    disabled={disabled}
                                                    name={'field-value-' + index}
                                                    onChange={event => onChange(value, event.target.checked)}
                                                    type="checkbox"
                                                />
                                                <div
                                                    className="filter-faceted__value"
                                                    onClick={() => onChange(value, true, true)}
                                                >
                                                    {renderValue(displayValue)}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                                {searchStr && filteredFieldDistinctValues?.length === 0 && (
                                    <div className="field-modal__empty-msg">No value matches '{searchStr}'.</div>
                                )}
                            </ul>
                        )}
                    </div>
                    {taggedValues?.length > 0 && (
                        <div className="col-xs-6">
                            <div className="filter-faceted__tags-title">Selected</div>
                            <ul className="nav nav-stacked labkey-wizard-pills filter-faceted__tags-div">
                                {taggedValues.map((value, index) => {
                                    let displayValue = value;

                                    if (value === null || value === undefined) displayValue = '[blank]';

                                    return (
                                        <li className="filter-status__faceted" key={index}>
                                            <div className="filter-status-value">
                                                <i
                                                    className="symbol fa fa-close"
                                                    onClick={() => onChange(value, false)}
                                                />
                                                <span>{displayValue}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

FilterFacetedSelector.displayName = 'FilterFacetedSelector';
