import React, {FC, memo, useCallback, useEffect, useMemo, useState} from 'react';

import { Filter, Query } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ALL_VALUE_DISPLAY, EMPTY_VALUE_DISPLAY, getCheckedFilterValues, getUpdatedChooseValuesFilter } from "./utils";
import {Col, Row} from "react-bootstrap";

interface Props {
    selectDistinctOptions: Query.SelectDistinctOptions;
    fieldKey: string;
    fieldFilter: Filter.IFilter;
    onFieldFilterUpdate?: (newFilter: Filter.IFilter) => void;
}

export const FilterFacetedSelector: FC<Props> = memo(props => {
    const { selectDistinctOptions, fieldKey, fieldFilter, onFieldFilterUpdate } = props;

    const [fieldDistinctValues, setFieldDistinctValues] = useState<string[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [searchStr, setSearchStr] = useState<string>(undefined);

    useEffect(() => {
        Query.selectDistinctRows({
            ...selectDistinctOptions,
            success: result => {
                let distinctValues = result.values
                    .map(val => {
                        if (val === null || val === undefined) return EMPTY_VALUE_DISPLAY;
                        return val;
                    })
                    .sort(naturalSort);
                distinctValues.unshift(ALL_VALUE_DISPLAY);
                setFieldDistinctValues(distinctValues);
            },
            failure: error => {
                console.error(error);
                setError(resolveErrorMessage(error));
            },
        });
    }, [selectDistinctOptions, fieldKey]);

    const checkedValues = useMemo(() => {
        return getCheckedFilterValues(fieldFilter, fieldDistinctValues)
    }, [fieldFilter, fieldKey, fieldDistinctValues]); // need to add fieldKey

    const taggedValues = useMemo(() => {
        if (checkedValues?.indexOf(ALL_VALUE_DISPLAY) > -1)
            return [];
        return checkedValues;
    }, [checkedValues]);

    const onSearchStrChange = useCallback((e) => {
        setSearchStr(e.target.value);
    }, []);

    const onChange = useCallback(
        (value: string, checked: boolean, uncheckOthers?: boolean) => {
            const newFilter = getUpdatedChooseValuesFilter(fieldDistinctValues, fieldKey, value, checked, fieldFilter, uncheckOthers);
            onFieldFilterUpdate(newFilter);
        },
        [fieldDistinctValues, fieldKey, fieldFilter, onFieldFilterUpdate]
    );

    const filteredFieldDistinctValues = useMemo(() => {
        if (!searchStr)
            return fieldDistinctValues;

        return fieldDistinctValues?.filter(val => {
            return val?.toLowerCase().indexOf(searchStr.toLowerCase()) > -1;
        });
    }, [fieldDistinctValues, searchStr]);

    return (
        <>
            {error && <Alert>{error}</Alert>}
            {!fieldDistinctValues && <LoadingSpinner />}
            <div className="list-group search-parent-entity-col search-parent-entity-col-values-list">
                {fieldDistinctValues?.length > 10 &&
                    <div>
                        <input
                            className="form-control find-filter-typeahead-input"
                            value={searchStr ?? ''}
                            onChange={onSearchStrChange}
                            type="text"
                        />
                    </div>
                }
                <Row className="XXX__container">
                    <Col xs={6} className="XXX">
                        <ul className="nav nav-stacked labkey-wizard-pills">
                            {filteredFieldDistinctValues?.map((value, index) => {
                                let displayValue = value;
                                if (value === null || value === undefined) displayValue = '[blank]';

                                return (
                                    <li key={index}
                                        className="search-parent-entity-col-values-list-value"
                                        onClick={() => onChange(value, true, true)}
                                    >
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name={'field-value-' + index}
                                                onChange={(event) => onChange(value, event.target.checked)}
                                                checked={checkedValues.indexOf(value) > -1}
                                            />
                                            <span
                                                className="search-parent-entity-col-values-list-value-val"
                                                style={{ marginLeft: 5 }}>{displayValue}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Col>
                    <Col xs={6} className="YYY">
                        {taggedValues?.length > 0 && <div className="parent-search-panel__col-sub-title">Selected</div>}
                        <ul className="nav nav-stacked labkey-wizard-pills" style={{width: '100%'}}>
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
