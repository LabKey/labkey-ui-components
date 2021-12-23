import React, { FC, memo } from 'react';
import { EntityDataType } from '../entities/models';
import { Filter } from '@labkey/api';
import { capitalizeFirstChar } from '../../util/utils';
import { SchemaQuery } from '../../../public/SchemaQuery';

export interface FilterCardProps {
    entityDataType: EntityDataType;
    schemaQuery?: SchemaQuery;
    index?: number;
    onAdd?: (entityDataType: EntityDataType) => void;
    onEdit?: (index: number) => void;
}

export const FilterCard: FC<FilterCardProps> = memo(props => {
    const { entityDataType, index, onAdd, schemaQuery } = props;

    if (!entityDataType.filterArray?.length || !schemaQuery) {
        return (
            <>
                <div className="filter-cards__card" onClick={() => onAdd(entityDataType)}>
                    <div className={"filter-card__header " + entityDataType.filterCardHeaderClass}>
                        {capitalizeFirstChar(entityDataType.nounAsParentSingular)} Properties
                    </div>
                    <div className="filter-card__empty-content empty">
                        +
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <div className={'filter-cards__card'}>
                <div className={"filter-card__header " + entityDataType.filterCardHeaderClass}>
                    {capitalizeFirstChar(entityDataType.nounAsParentSingular)}<br/>
                    {capitalizeFirstChar(schemaQuery.queryName)}
                </div>
            </div>
            <div className="cards__card-content">
                Coming soon...
            </div>
        </>
    );
});


interface Props {
    cards: FilterCardProps[];
}

export const FilterCards: FC<Props> = props => (
    <div className="cards">
        <div className="row">
            {props.cards.map((cardProps, i) => (
                <div className="col-xs-6 col-md-4 col-lg-3" key={cardProps.entityDataType.nounSingular}>
                    <FilterCard {...cardProps} index={i} />
                </div>
            ))}
        </div>
    </div>
);
