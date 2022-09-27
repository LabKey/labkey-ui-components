import React, { FC, memo, useCallback } from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AppURL } from '../../url/AppURL';

import { FIND_SAMPLES_BY_FILTER_KEY } from '../../app/constants';

import { formatDateTime } from '../../util/Date';

import { EntityDataType } from '../entities/models';

import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { DataClassDataType, SampleTypeDataType } from '../entities/constants';

import { SCHEMAS } from '../../schemas';

import { getSampleFinderLocalStorageKey, searchFiltersToJson } from './utils';
import { FieldFilter } from './models';
import { SAMPLE_FINDER_SESSION_PREFIX } from './constants';

const getFieldFilter = (model: QueryModel, filter: Filter.IFilter): FieldFilter => {
    const colName = filter.getColumnName();
    const column = model.getColumn(colName);

    return {
        fieldKey: column?.fieldKey ?? colName,
        fieldCaption: column?.caption ?? colName,
        filter,
        jsonType: column?.jsonType ?? 'string',
    } as FieldFilter;
};

interface Props {
    asSubMenu?: boolean;
    baseFilter?: Filter.IFilter[];
    baseModel?: QueryModel;
    entityDataType: EntityDataType;
    model: QueryModel;
}

export const FindDerivativesButton: FC<Props> = memo(props => {
    const { baseModel, baseFilter, model, entityDataType, asSubMenu } = props;

    const onClick = useCallback(() => {
        const currentTimestamp = new Date();
        const sessionViewName = SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(currentTimestamp);

        let fieldFilters = [];
        // optionally include baseFilter when passed without a baseModel (i.e. apply to the same schemaQuery as the other filters)
        if (baseFilter && !baseModel) {
            fieldFilters = fieldFilters.concat(baseFilter.map(filter => getFieldFilter(model, filter)));
        }
        // always include viewFilters and user defined filters (filterArray)
        fieldFilters = fieldFilters.concat(model.viewFilters.map(filter => getFieldFilter(model, filter)));
        fieldFilters = fieldFilters.concat(model.filterArray.map(filter => getFieldFilter(model, filter)));

        const filterProps = [];
        if (baseModel && baseFilter) {
            filterProps.push({
                schemaQuery: baseModel.schemaQuery,
                filterArray: [getFieldFilter(baseModel, baseFilter[0])],
                entityDataType:
                    baseModel.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA ? DataClassDataType : SampleTypeDataType,
                dataTypeDisplayName: baseModel.title ?? baseModel.queryInfo.title ?? baseModel.queryName,
            });
        }
        filterProps.push({
            schemaQuery: model.schemaQuery,
            filterArray: fieldFilters,
            entityDataType,
            dataTypeDisplayName: model.title ?? model.queryInfo.title ?? model.queryName,
        });

        sessionStorage.setItem(getSampleFinderLocalStorageKey(), searchFiltersToJson(filterProps, 0, currentTimestamp));

        window.location.href = AppURL.create('search', FIND_SAMPLES_BY_FILTER_KEY)
            .addParam('view', sessionViewName)
            .toHref();
    }, [baseFilter, baseModel, entityDataType, model]);

    if (!model.queryInfo) return null;

    if (asSubMenu) {
        const items = <MenuItem onClick={onClick}>Find Derivatives</MenuItem>;
        return <ResponsiveMenuButton id="samples-finder-menu" items={items} text="Find" asSubMenu={asSubMenu} />;
    }

    return (
        <Button className="responsive-menu" onClick={onClick}>
            Find Derivatives
        </Button>
    );
});
