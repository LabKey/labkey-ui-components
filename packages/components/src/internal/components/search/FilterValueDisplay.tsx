import React, { FC, memo, useMemo } from 'react';
import classNames from 'classnames';

import { Filter } from '@labkey/api';

import { OverlayTrigger, Popover } from 'react-bootstrap';

import { COLUMN_NOT_IN_FILTER_TYPE } from '../../query/filter';

import { getFilterValuesAsArray, NEGATE_FILTERS, SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE } from './utils';

interface FilterValueDisplayProps {
    filter: Filter.IFilter;
    noValueInQueryFilterMsg?: string;
    onFilterValueExpand?: () => void;
}

function getShortFilterTypeDisplay(filterType: Filter.IFilterType) {
    const displayText = filterType.getDisplayText();
    switch (displayText) {
        case 'Does Not Equal':
            return <>&#8800;</>;
        case 'Equals':
            return '=';
        case 'Has Any Value':
            return 'Any Value';
        case 'Is Greater Than':
            return '>';
        case 'Is Less Than':
            return '<';
        case 'Is Greater Than or Equal To':
            return <>&#8805;</>;
        case 'Is Less Than or Equal To':
            return <>&#8804;</>;
        default:
            return displayText;
    }
}

export const FilterValueDisplay: FC<FilterValueDisplayProps> = memo(props => {
    const { filter, onFilterValueExpand, noValueInQueryFilterMsg } = props;

    const exclude = useMemo(() => {
        return NEGATE_FILTERS.indexOf(filter.getFilterType().getURLSuffix()) > -1;
    }, [filter]);

    const filterTypeLabel = useMemo(() => {
        const filterType = filter.getFilterType();
        const filterUrlSuffix = filterType.getURLSuffix();

        if (SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE.indexOf(filterUrlSuffix) === -1)
            return getShortFilterTypeDisplay(filterType);

        return null;
    }, [filter]);

    const filterValueDisplay = useMemo(() => {
        const filterType = filter.getFilterType();
        const filterUrlSuffix = filterType.getURLSuffix();
        let filterValueDisplay = null;

        if (filterUrlSuffix === COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix()) {
            filterValueDisplay = noValueInQueryFilterMsg ?? 'Without data from this type';
        } else if (
            filterUrlSuffix === Filter.Types.IN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.NOT_IN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.CONTAINS_ONE_OF.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.CONTAINS_NONE_OF.getURLSuffix()
        ) {
            const values = getFilterValuesAsArray(filter);
            filterValueDisplay = (
                <ul className="filter-display__filter-values-ul">
                    {values?.map((value, index) => {
                        if (index > 5) return null;
                        if (index === 5) {
                            return (
                                <li className="filter-display__filter-value-li" key={index}>
                                    <OverlayTrigger
                                        overlay={
                                            <Popover bsClass="popover" id={'filter-value-list-popover-' + index}>
                                                <div>
                                                    {[...values].splice(5).map(val => (
                                                        <div key={val}>{val}</div>
                                                    ))}
                                                </div>
                                            </Popover>
                                        }
                                        placement="top"
                                    >
                                        <a onClick={onFilterValueExpand}>and {values.length - 5} more</a>
                                    </OverlayTrigger>
                                </li>
                            );
                        }

                        return (
                            <li key={index} className="filter-display__filter-value-li">
                                {value}
                            </li>
                        );
                    })}
                </ul>
            );
        } else if (
            filterUrlSuffix === Filter.Types.BETWEEN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.NOT_BETWEEN.getURLSuffix()
        ) {
            const values = filter.getValue();
            filterValueDisplay = values[0] + ' - ' + values[1];
        } else {
            if (filterType.isDataValueRequired()) {
                filterValueDisplay = filter.getValue();
            }
        }

        return filterValueDisplay;
    }, [filter, onFilterValueExpand]);

    return (
        <span
            className={classNames('filter-display__filter-value', {
                'field-display__filter-value-negate': exclude,
            })}
        >
            {filterTypeLabel && <>{filterTypeLabel} </>}
            {filterValueDisplay}
        </span>
    );
});
