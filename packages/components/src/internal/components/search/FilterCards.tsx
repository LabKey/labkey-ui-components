import React, { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { Filter } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';

import { FieldFilter, FilterProps } from './models';
import {
    getFilterValuesAsArray,
    NEGATE_FILTERS,
    SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE
} from './utils';

interface FilterValueDisplayProps {
    fieldFilter: FieldFilter;
    onFilterValueExpand?: () => void;
}

function getShortFilterTypeDisplay(filterType: Filter.IFilterType) {
    const displayText = filterType.getDisplayText();
    switch (displayText) {
        case "Does Not Equal":
            return <>&#8800;</>;
        case "Equals":
            return '=';
        case "Has Any Value":
            return 'Any Value';
        case "Is Greater Than":
            return '>';
        case "Is Less Than":
            return '<';
        case "Is Greater Than or Equal To":
            return <>&#8805;</>;
        case "Is Less Than or Equal To":
            return <>&#8804;</>;
        default:
            return displayText;
    }
}

export const FilterValueDisplay: FC<FilterValueDisplayProps> = memo(props => {
    const { fieldFilter, onFilterValueExpand } = props;
    const { filter } = fieldFilter;

    const renderFilter = useCallback(() => {
            const filterType = filter.getFilterType();
            const filterUrlSuffix = filterType.getURLSuffix();
            let filterTypeLabel = null;
            let filterValueDisplay = null;

            const negate = NEGATE_FILTERS.indexOf(filterUrlSuffix) > -1;

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
                    <span className={classNames('filter-display__filter-value', {
                        'field-display__filter-value-negate': negate
                    })}>
                        {filterTypeLabel && <>{filterTypeLabel} </>}
                        {filterValueDisplay}
                    </span>
                </>
            );
        },
        [onFilterValueExpand, filter]
    );

    return <>{renderFilter()}</>;
});

interface FilterEditProps extends FilterProps {
    onDelete: (index) => void;
    onEdit: (index) => void;
    onAdd: (entityDataType: EntityDataType) => void;
    onFilterValueExpand?: (cardIndex: number, fieldFilter: FieldFilter) => void;
}

// exported for jest testing
export const FilterCard: FC<FilterEditProps> = memo(props => {
    const {
        entityDataType,
        filterArray,
        index,
        onAdd,
        onDelete,
        onEdit,
        schemaQuery,
        onFilterValueExpand,
    } = props;

    const _onAdd = useCallback(() => {
        onAdd(entityDataType);
    }, [onAdd, entityDataType]);

    const _onEdit = useCallback(() => {
        onEdit(index);
    }, [onEdit, index]);

    const _onDelete = useCallback(() => {
        onDelete(index);
    }, [onDelete, index]);

    const renderFilterRow = useCallback(
        (fieldFilter: FieldFilter) => {
            return (
                <tr key={fieldFilter.fieldKey} className="filter-display__row">
                    <td className="filter-display__field-label">{fieldFilter.fieldCaption}:</td>
                    <td className="filter-display__filter-content">
                        <FilterValueDisplay
                            fieldFilter={fieldFilter}
                            onFilterValueExpand={() => onFilterValueExpand(index, fieldFilter)}
                        />
                    </td>
                </tr>
            );
        },
        [onDelete, index, schemaQuery, onFilterValueExpand]
    );

    if (!schemaQuery) {
        return (
            <>
                <div className="filter-cards__card" onClick={_onAdd}>
                    <div className={'filter-card__header without-secondary ' + entityDataType.filterCardHeaderClass}>
                        <div className="primary-text">
                            {capitalizeFirstChar(entityDataType.nounAsParentSingular)} Properties
                        </div>
                    </div>
                    <div className="filter-card__empty-content">+</div>
                </div>
            </>
        );
    }
    return (
        <>
            <div className="filter-cards__card">
                <div className={'filter-card__header ' + entityDataType.filterCardHeaderClass}>
                    <div className="pull-left">
                        <div className="secondary-text">{capitalizeFirstChar(entityDataType.nounAsParentSingular)}</div>
                        <div className="primary-text">{schemaQuery.queryName}</div>
                    </div>
                    <div className="pull-right actions">
                        {onEdit && <i className="fa fa-pencil action-icon" onClick={_onEdit} />}
                        {onDelete && <i className="fa fa-trash action-icon" onClick={_onDelete} />}
                    </div>
                </div>
                <div className="filter-card__card-content">
                    {!filterArray?.length /*TODO Is this supported?*/ && (
                        <>
                            <hr />
                            <div>
                                Showing only samples with {schemaQuery.queryName}{' '}
                                {entityDataType.nounAsParentSingular.toLowerCase()}s
                            </div>
                        </>
                    )}
                    {!!filterArray?.length && (
                        <table>
                            <tbody>
                                {filterArray.map(fieldFilter => {
                                    return renderFilterRow(fieldFilter);
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
});

interface Props {
    cards: FilterProps[];
    className?: string;
    onFilterDelete?: (index) => void;
    onFilterEdit?: (index) => void;
    onAddEntity: (entityDataType: EntityDataType) => void;
    onFilterValueExpand?: (cardIndex: number, fieldFilter: FieldFilter) => void;
}

export const FilterCards: FC<Props> = props => (
    <div className={'filter-cards ' + props.className}>
        {props.cards.map((cardProps, i) => (
            <FilterCard
                {...cardProps}
                onAdd={props.onAddEntity}
                onDelete={props.onFilterDelete}
                onEdit={props.onFilterEdit}
                index={i}
                key={i}
                onFilterValueExpand={props.onFilterValueExpand}
            />
        ))}
    </div>
);
