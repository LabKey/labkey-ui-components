import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Filter, Query } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ALL_VALUE_DISPLAY, EMPTY_VALUE_DISPLAY, getCheckedFilterValues, getUpdatedChooseValuesFilter } from './utils';

const MAX_DISTINCT_FILTER_OPTIONS = 250;

interface Props {
    api?: ComponentsAPIWrapper;
    canBeBlank: boolean;
    disabled?: boolean;
    fieldFilters: Filter.IFilter[];
    fieldKey: string;
    onFieldFilterUpdate?: (newFilters: Filter.IFilter[], index) => void;
    selectDistinctOptions: Query.SelectDistinctOptions;
    // show search box if number of unique values > N
    showSearchLength?: number;
}

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const {
        api,
        canBeBlank,
        disabled,
        selectDistinctOptions,
        fieldKey,
        fieldFilters,
        onFieldFilterUpdate,
        showSearchLength,
    } = props;

    const [fieldDistinctValues, setFieldDistinctValues] = useState<string[]>(undefined);
    const [searchDistinctValues, setSearchDistinctValues] = useState<string[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [searchStr, setSearchStr] = useState<string>(undefined);
    const [allShown, setAllShown] = useState<boolean>(undefined);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setDistinctValues(true);
    }, [fieldKey]); // on fieldKey change, reload selection values

    const setDistinctValues = useCallback(
        async (checkForAll: boolean, searchStr?: string) => {
            try {
                setLoading(true);
                setError(undefined);

                const filterArray = searchStr
                    ? [Filter.create(fieldKey, searchStr, Filter.Types.CONTAINS)].concat(
                          selectDistinctOptions?.filterArray
                      )
                    : selectDistinctOptions?.filterArray;

                const result = await api.query.selectDistinctRows({
                    ...selectDistinctOptions,
                    filterArray,
                    maxRows: MAX_DISTINCT_FILTER_OPTIONS + 1,
                });

                const toShow = result.values.slice(0, MAX_DISTINCT_FILTER_OPTIONS);
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
                if (toShow.length > 0 && (hasBlank || (canBeBlank && result.values.length > MAX_DISTINCT_FILTER_OPTIONS))) {
                    distinctValues.unshift(EMPTY_VALUE_DISPLAY);
                }

                // add [All] to first if the total distinct values is < 250
                const hasAllValues = !searchStr && result.values.length <= MAX_DISTINCT_FILTER_OPTIONS;
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
                console.error(e);
                setAllShown(true);
                if (searchStr) {
                    setSearchDistinctValues([]);
                } else {
                    setFieldDistinctValues([]);
                }
                setError(resolveErrorMessage(e));
            } finally {
                setLoading(false);
            }
        },
        [api.query, canBeBlank, fieldKey, selectDistinctOptions]
    );

    const checkedValues = useMemo(() => {
        return getCheckedFilterValues(fieldFilters?.[0], allShown ? fieldDistinctValues : undefined);
    }, [fieldFilters?.[0], fieldKey, fieldDistinctValues, allShown]); // need to add fieldKey

    const taggedValues = useMemo(() => {
        if (checkedValues?.indexOf(ALL_VALUE_DISPLAY) > -1) return [];
        return checkedValues;
    }, [checkedValues]);

    const onSearchStrChange = useCallback(e => {
        setSearchStr(e.target.value);
        setDistinctValues(false, e.target.value);
    }, []);

    const onChange = useCallback(
        (value: string, checked: boolean, uncheckOthers?: boolean) => {
            if (disabled) return;

            const newFilter = getUpdatedChooseValuesFilter(
                allShown ? fieldDistinctValues : undefined,
                fieldKey,
                value,
                checked,
                fieldFilters?.[0], // choose values applies only to the first filter
                uncheckOthers
            );
            onFieldFilterUpdate([newFilter], 0);
        },
        [disabled, allShown, fieldDistinctValues, fieldKey, fieldFilters, onFieldFilterUpdate]
    );

    const filteredFieldDistinctValues = useMemo(() => {
        if (!searchStr) return fieldDistinctValues;

        return searchDistinctValues?.filter(val => {
            return val !== ALL_VALUE_DISPLAY && val != EMPTY_VALUE_DISPLAY;
        });
    }, [fieldDistinctValues, searchDistinctValues, searchStr]);

    if (!fieldDistinctValues || allShown === undefined) return <LoadingSpinner />;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <div className="filter-faceted__panel">
                {(fieldDistinctValues?.length > showSearchLength || searchStr) && (
                    <div>
                        <input
                            id="filter-faceted__typeahead-input"
                            className="form-control filter-faceted__typeahead-input"
                            value={searchStr ?? ''}
                            onChange={onSearchStrChange}
                            type="text"
                            placeholder="Type to filter"
                            disabled={disabled}
                        />
                    </div>
                )}
                {!allShown && (
                    <div className="row">
                        <Col xs={12} className="bottom-spacing">
                            <div>
                                There are more than {MAX_DISTINCT_FILTER_OPTIONS} distinct values. Use the filter box
                                above to find additional values.
                            </div>
                        </Col>
                    </div>
                )}
                <div className="row">
                    <Col xs={taggedValues?.length > 0 ? 6 : 12}>
                        {loading && <LoadingSpinner />}
                        {!loading && (
                            <ul className="nav nav-stacked labkey-wizard-pills">
                                {filteredFieldDistinctValues?.map((value, index) => {
                                    let displayValue = value;
                                    if (value === null || value === undefined) displayValue = '[blank]';

                                    return (
                                        <li key={index} className="filter-faceted__li">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input filter-faceted__checkbox"
                                                    type="checkbox"
                                                    name={'field-value-' + index}
                                                    onChange={event => onChange(value, event.target.checked)}
                                                    checked={checkedValues.indexOf(value) > -1}
                                                    disabled={disabled}
                                                />
                                                <div
                                                    className="filter-faceted__value"
                                                    onClick={() => onChange(value, true, true)}
                                                >
                                                    {displayValue}
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
                    </Col>
                    {taggedValues?.length > 0 && (
                        <Col xs={6}>
                            <div className="filter-faceted__tags-title">Selected</div>
                            <ul className="nav nav-stacked labkey-wizard-pills filter-faceted__tags-div">
                                {taggedValues?.map((value, index) => {
                                    let displayValue = value;

                                    if (value === null || value === undefined) displayValue = '[blank]';

                                    return (
                                        <li key={index} className="filter-status__faceted">
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
                        </Col>
                    )}
                </div>
            </div>
        </>
    );
});

FilterFacetedSelector.defaultProps = {
    showSearchLength: 20,
    api: getDefaultAPIWrapper(),
};
