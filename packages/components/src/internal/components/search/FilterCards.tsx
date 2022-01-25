import React, { FC, memo, useCallback } from 'react';

import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import {FieldFilter, FilterProps} from "./models";
import {Filter} from "@labkey/api";
import {getFieldFilterKey, getFilterValuesAsArray, SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE} from "./utils";
import {SchemaQuery} from "../../../public/SchemaQuery";

interface FilterValueDisplayProps {
    fieldFilter: FieldFilter;
    expanded: boolean;
    onFilterValueExpandToggle?: () => void;
}

export const FilterValueDisplay: FC<FilterValueDisplayProps> = memo(props => {
    const { fieldFilter, expanded, onFilterValueExpandToggle } = props;
    const { filter } = fieldFilter;

    const renderFilter = useCallback((filter: Filter.IFilter, isExpanded?: boolean) => {
        const filterType = filter.getFilterType();
        const filterUrlSuffix = filterType.getURLSuffix();
        let filterTypeLabel = null;
        let filterValueDisplay = null;

        if (SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE.indexOf(filterUrlSuffix) === -1)
            filterTypeLabel = filterType.getDisplayText() + (filterType.isDataValueRequired() ? ':' : '');

        if (filterUrlSuffix === Filter.Types.IN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.NOT_IN.getURLSuffix()) {
            const values = getFilterValuesAsArray(filter);
            filterValueDisplay = (
                <ul className="filter-value-display-values-list">
                    {values?.map((value, index) => {
                        if (index > 5 && !isExpanded)
                            return null;
                        if (index === 5 && !isExpanded) {
                            return (
                                <li className='filter-value-display-value-li'>
                                    <a onClick={onFilterValueExpandToggle}>
                                        and {values.length - 5} more
                                    </a>
                                </li>
                            );
                        }

                        return (
                            <li key={index} className='filter-value-display-value-li'>
                                {value}
                            </li>
                        )
                    })}
                    {(values.length > 5 && isExpanded) &&
                        <li className='filter-value-display-value-li'>
                            <a onClick={onFilterValueExpandToggle}>
                                show Less
                            </a>
                        </li>}
                </ul>
            );

        }
        else if (filterUrlSuffix === Filter.Types.BETWEEN.getURLSuffix() ||
            filterUrlSuffix === Filter.Types.NOT_BETWEEN.getURLSuffix()){
            const values = filter.getValue();
            filterValueDisplay = values[0] + ' - ' + values[1];
        }
        else {
            if (filterType.isDataValueRequired) {
                filterValueDisplay = filter.getValue();
            }
        }

        return (<>
            <div className='filter-value__operator'>{filterTypeLabel}</div>
            <div className='filter-value__value'>{filterValueDisplay}</div>
        </>);
    }, [onFilterValueExpandToggle]);

    return (
        <>
            {renderFilter(filter, expanded)}
        </>
    );
});

interface FilterEditProps extends FilterProps {
    onDelete: (index) => void;
    onEdit: (index) => void;
    onAdd: (entityDataType: EntityDataType) => void;
    toggleFieldFilterExpandStatus?: (fieldFilter: FieldFilter, schemaQuery?: SchemaQuery) => void;
    filterExpandedStatusMap?: {[key: string] : boolean};
}

// exported for jest testing
export const FilterCard: FC<FilterEditProps> = memo(props => {
    const { entityDataType, filterArray, index, onAdd, onDelete, onEdit, schemaQuery, filterExpandedStatusMap, toggleFieldFilterExpandStatus } = props;

    const _onAdd = useCallback(() => {
        onAdd(entityDataType);
    }, [onAdd, entityDataType]);

    const _onEdit = useCallback(() => {
        onEdit(index);
    }, [onEdit, index]);

    const _onDelete = useCallback(() => {
        onDelete(index);
    }, [onDelete, index]);

    const renderFilterRow = useCallback((fieldFilter: FieldFilter) => {
        const fieldKey = getFieldFilterKey(fieldFilter, schemaQuery);
        const expanded = !!filterExpandedStatusMap?.[fieldKey];
        return (
            <tr key={fieldFilter.fieldKey} className="filter-row">
                <td className="filter-label-col">
                    {fieldFilter.fieldCaption}:
                </td>
                <td className="filter-value-col">
                    <FilterValueDisplay
                        fieldFilter={fieldFilter}
                        onFilterValueExpandToggle={() => toggleFieldFilterExpandStatus(fieldFilter, schemaQuery)}
                        expanded={expanded}
                    />
                </td>
            </tr>
        );
    }, [onDelete, index, schemaQuery, toggleFieldFilterExpandStatus, filterExpandedStatusMap]);

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
                    {!filterArray?.length && (
                        <>
                            <hr />
                            <div>
                                Showing only samples with {schemaQuery.queryName}{' '}
                                {entityDataType.nounAsParentSingular.toLowerCase()}s
                            </div>
                        </>
                    )}
                    {!!filterArray?.length &&
                        <table>
                            <tbody>
                            {filterArray.map(fieldFilter => {
                                return renderFilterRow(fieldFilter);
                            })}
                            </tbody>
                        </table>
                    }
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
    toggleFieldFilterExpandStatus?: (fieldFilter: FieldFilter, schemaQuery?: SchemaQuery) => void;
    filterExpandedStatusMap?: {[key: string] : boolean};
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
                toggleFieldFilterExpandStatus={props.toggleFieldFilterExpandStatus}
                filterExpandedStatusMap={props.filterExpandedStatusMap}
            />
        ))}
    </div>
);
