import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Filter, Query } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ALL_VALUE_DISPLAY, EMPTY_VALUE_DISPLAY, getCheckedFilterValues, getUpdatedChooseValuesFilter } from './utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

interface Props {
    api?: ComponentsAPIWrapper;
    selectDistinctOptions: Query.SelectDistinctOptions;
    fieldKey: string;
    fieldFilters: Filter.IFilter[];
    onFieldFilterUpdate?: (newFilters: Filter.IFilter[], index) => void;
    showSearchLength?: number; // show search box if number of unique values > N
}

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const { api, selectDistinctOptions, fieldKey, fieldFilters, onFieldFilterUpdate, showSearchLength } = props;

    const [fieldDistinctValues, setFieldDistinctValues] = useState<string[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [searchStr, setSearchStr] = useState<string>(undefined);

    useEffect(() => {
        api.query
            .selectDistinctRows(selectDistinctOptions)
            .then(result => {
                const distinctValues = result.values.sort(naturalSort).map(val => {
                    if (val === '' || val === null || val === undefined) return EMPTY_VALUE_DISPLAY;
                    return val;
                });

                // move [blank] to first
                if (distinctValues.indexOf(EMPTY_VALUE_DISPLAY) > 0) {
                    distinctValues.splice(distinctValues.indexOf(EMPTY_VALUE_DISPLAY), 1);
                    distinctValues.unshift(EMPTY_VALUE_DISPLAY);
                }

                // add [All] to first
                distinctValues.unshift(ALL_VALUE_DISPLAY);
                setFieldDistinctValues(distinctValues);
            })
            .catch(error => {
                console.error(error);
                setFieldDistinctValues([]);
                setError(resolveErrorMessage(error));
            });
    }, [selectDistinctOptions, fieldKey]); // on fieldKey change, reload selection values

    const checkedValues = useMemo(() => {
        return getCheckedFilterValues(fieldFilters?.[0], fieldDistinctValues);
    }, [fieldFilters?.[0], fieldKey, fieldDistinctValues]); // need to add fieldKey

    const taggedValues = useMemo(() => {
        if (checkedValues?.indexOf(ALL_VALUE_DISPLAY) > -1) return [];
        return checkedValues;
    }, [checkedValues]);

    const onSearchStrChange = useCallback(e => {
        setSearchStr(e.target.value);
    }, []);

    const onChange = useCallback(
        (value: string, checked: boolean, uncheckOthers?: boolean) => {
            const newFilter = getUpdatedChooseValuesFilter(
                fieldDistinctValues,
                fieldKey,
                value,
                checked,
                fieldFilters?.[0], // choose values applies only to the first filter
                uncheckOthers
            );
            onFieldFilterUpdate([newFilter], 0);
        },
        [fieldDistinctValues, fieldKey, fieldFilters, onFieldFilterUpdate]
    );

    const filteredFieldDistinctValues = useMemo(() => {
        if (!searchStr) return fieldDistinctValues;

        return fieldDistinctValues
            ?.filter(val => {
                return val !== ALL_VALUE_DISPLAY && val != EMPTY_VALUE_DISPLAY;
            })
            .filter(val => {
                return val?.toLowerCase().indexOf(searchStr.toLowerCase()) > -1;
            });
    }, [fieldDistinctValues, searchStr]);

    return (
        <>
            {error && <Alert>{error}</Alert>}
            {!fieldDistinctValues && <LoadingSpinner />}
            <div className="filter-faceted__panel">
                {fieldDistinctValues?.length > showSearchLength && (
                    <div>
                        <input
                            id="filter-faceted__typeahead-input"
                            className="form-control filter-faceted__typeahead-input"
                            value={searchStr ?? ''}
                            onChange={onSearchStrChange}
                            type="text"
                            placeholder="Type to filter"
                        />
                    </div>
                )}
                <Row>
                    <Col xs={taggedValues?.length > 0 ? 6 : 12}>
                        <ul className="nav nav-stacked labkey-wizard-pills">
                            {filteredFieldDistinctValues?.map((value, index) => {
                                let displayValue = value;
                                if (value === null || value === undefined) displayValue = '[blank]';

                                return (
                                    <li
                                        key={index}
                                        className="filter-faceted__li"
                                        onClick={() => onChange(value, true, true)}
                                    >
                                        <div className="form-check">
                                            <input
                                                className="form-check-input filter-faceted__checkbox"
                                                type="checkbox"
                                                name={'field-value-' + index}
                                                onChange={event => onChange(value, event.target.checked)}
                                                checked={checkedValues.indexOf(value) > -1}
                                            />
                                            <div className="filter-faceted__value">{displayValue}</div>
                                        </div>
                                    </li>
                                );
                            })}
                            {searchStr && filteredFieldDistinctValues?.length === 0 && (
                                <div className="filter-modal__empty-msg">No value matches '{searchStr}'.</div>
                            )}
                        </ul>
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
                </Row>
            </div>
        </>
    );
});

FilterFacetedSelector.defaultProps = {
    showSearchLength: 20,
    api: getDefaultAPIWrapper(),
};
