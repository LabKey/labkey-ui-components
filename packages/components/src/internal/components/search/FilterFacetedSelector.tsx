import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Filter, Query } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ALL_VALUE_DISPLAY, EMPTY_VALUE_DISPLAY, getCheckedFilterValues, getUpdatedChooseValuesFilter } from './utils';

interface Props {
    api?: ComponentsAPIWrapper;
    selectDistinctOptions: Query.SelectDistinctOptions;
    fieldKey: string;
    fieldFilter: Filter.IFilter;
    onFieldFilterUpdate?: (newFilter: Filter.IFilter) => void;
    showSearchLength?: number; // show search box if number of unique values > N
}

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const { api, selectDistinctOptions, fieldKey, fieldFilter, onFieldFilterUpdate, showSearchLength } = props;

    const [fieldDistinctValues, setFieldDistinctValues] = useState<string[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [searchStr, setSearchStr] = useState<string>(undefined);

    useEffect(() => {
        api.query
            .selectDistinctRows(selectDistinctOptions)
            .then(result => {
                const distinctValues = result.values
                    .map(val => {
                        if (val === '' || val === null || val === undefined) return EMPTY_VALUE_DISPLAY;
                        return val;
                    })
                    .sort(naturalSort);
                distinctValues.unshift(ALL_VALUE_DISPLAY);
                setFieldDistinctValues(distinctValues);
            })
            .catch(error => {
                console.error(error);
                setError(resolveErrorMessage(error));
            });
    }, [selectDistinctOptions, fieldKey]);

    const checkedValues = useMemo(() => {
        return getCheckedFilterValues(fieldFilter, fieldDistinctValues);
    }, [fieldFilter, fieldKey, fieldDistinctValues]); // need to add fieldKey

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
                fieldFilter,
                uncheckOthers
            );
            onFieldFilterUpdate(newFilter);
        },
        [fieldDistinctValues, fieldKey, fieldFilter, onFieldFilterUpdate]
    );

    const filteredFieldDistinctValues = useMemo(() => {
        if (!searchStr) return fieldDistinctValues;

        return fieldDistinctValues?.filter(val => {
            return val?.toLowerCase().indexOf(searchStr.toLowerCase()) > -1;
        });
    }, [fieldDistinctValues, searchStr]);

    return (
        <>
            {error && <Alert>{error}</Alert>}
            {!fieldDistinctValues && <LoadingSpinner />}
            <div className="list-group search-parent-entity-col-values-list">
                {fieldDistinctValues?.length > showSearchLength && (
                    <div>
                        <input
                            id="find-filter-typeahead-input"
                            className="form-control find-filter-typeahead-input"
                            value={searchStr ?? ''}
                            onChange={onSearchStrChange}
                            type="text"
                        />
                    </div>
                )}
                <Row>
                    <Col xs={6}>
                        <ul className="nav nav-stacked labkey-wizard-pills">
                            {filteredFieldDistinctValues?.map((value, index) => {
                                let displayValue = value;
                                if (value === null || value === undefined) displayValue = '[blank]';

                                return (
                                    <li
                                        key={index}
                                        className="search-parent-entity-col-values-list-value"
                                        onClick={() => onChange(value, true, true)}
                                    >
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name={'field-value-' + index}
                                                onChange={event => onChange(value, event.target.checked)}
                                                checked={checkedValues.indexOf(value) > -1}
                                            />
                                            <span
                                                className="search-parent-entity-col-values-list-value-val"
                                                style={{ marginLeft: 5 }}
                                            >
                                                {displayValue}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Col>
                    <Col xs={6}>
                        {taggedValues?.length > 0 && <div className="search-parent-entity-col-values-tags-title">Selected</div>}
                        <ul className="nav nav-stacked labkey-wizard-pills search-parent-entity-col-values-tags-div">
                            {taggedValues?.map((value, index) => {
                                let displayValue = value;

                                if (value === null || value === undefined) displayValue = '[blank]';

                                return (
                                    <li key={index} className="OmniBox--multi">
                                        <div className="OmniBox-value filter-result-pills-value">
                                            <i className="symbol fa fa-close" onClick={() => onChange(value, false)} />
                                            <span>{displayValue}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Col>
                </Row>
            </div>
        </>
    );
});

FilterFacetedSelector.defaultProps = {
    showSearchLength: 20,
    api: getDefaultAPIWrapper(),
};
