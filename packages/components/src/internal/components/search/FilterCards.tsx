import React, { FC, memo, useCallback } from 'react';

import { Filter } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { SchemaQuery } from '../../../public/SchemaQuery';

export interface FilterCardProps {
    entityDataType: EntityDataType;
    filterArray?: Filter.IFilter[]; // the filters to be used in conjunction with the schemaQuery
    schemaQuery?: SchemaQuery;
    index?: number;
}

interface FilterEditProps extends FilterCardProps {
    onDelete: (index) => void;
    onEdit: (index) => void;
    onAdd: (entityDataType: EntityDataType) => void;
}

// exported for jest testing
export const FilterCard: FC<FilterEditProps> = memo(props => {
    const { entityDataType, filterArray, index, onAdd, onDelete, onEdit, schemaQuery } = props;

    const _onAdd = useCallback(() => {
        onAdd(entityDataType);
    }, [onAdd, entityDataType]);

    const _onEdit = useCallback(() => {
        onEdit(index);
    }, [onEdit, index]);

    const _onDelete = useCallback(() => {
        onDelete(index);
    }, [onDelete, index]);

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
                            <div>Showing all {schemaQuery.queryName} Samples</div>
                        </>
                    )}
                    {!!filterArray?.length && <>Filter view coming soon ...</>}
                </div>
            </div>
        </>
    );
});

interface Props {
    cards: FilterCardProps[];
    className?: string;
    onFilterDelete?: (index) => void;
    onFilterEdit?: (index) => void;
    onAddEntity: (entityDataType: EntityDataType) => void;
}

export const FilterCards: FC<Props> = props => (
    <div className={'filter-cards ' + props.className}>
        {props.cards.map((cardProps, i) => (
            <FilterCard {...cardProps} onAdd={props.onAddEntity} onDelete={props.onFilterDelete} onEdit={props.onFilterEdit} index={i} key={i} />
        ))}
    </div>
);
