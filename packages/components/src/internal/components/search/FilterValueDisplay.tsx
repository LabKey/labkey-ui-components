import React, { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { Filter } from '@labkey/api';

import { getFilterValuesAsArray, NEGATE_FILTERS, SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE } from './utils';

interface FilterValueDisplayProps {
    filter: Filter.IFilter;
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
    const { filter, onFilterValueExpand } = props;

    const renderFilter = useCallback(() => {
        const filterType = filter.getFilterType();
        const filterUrlSuffix = filterType.getURLSuffix();
        let filterTypeLabel = null;
        let filterValueDisplay = null;

        const exclude = NEGATE_FILTERS.indexOf(filterUrlSuffix) > -1;

        if (SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE.indexOf(filterUrlSuffix) === -1)
            filterTypeLabel = getShortFilterTypeDisplay(filterType);

        if (
            filterUrlSuffix === Filter.Types.IN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.NOT_IN.getURLSuffix()
        ) {
            const values = getFilterValuesAsArray(filter);
            filterValueDisplay = (
                <ul className="filter-display__filter-values-ul">
                    {values?.map((value, index) => {
                        if (index > 5) return null;
                        if (index === 5) {
                            return (
                                <li className="filter-display__filter-value-li">
                                    <a onClick={onFilterValueExpand}>and {values.length - 5} more</a>
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

        return (
            <>
                <span
                    className={classNames('filter-display__filter-value', {
                        'field-display__filter-value-negate': exclude,
                    })}
                >
                    {filterTypeLabel && <>{filterTypeLabel} </>}
                    {filterValueDisplay}
                </span>
            </>
        );
    }, [onFilterValueExpand, filter]);

    return <>{renderFilter()}</>;
});
