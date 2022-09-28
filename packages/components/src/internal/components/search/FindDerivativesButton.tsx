import React, {FC, memo, useCallback, useMemo} from 'react';

import { Filter } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AppURL } from '../../url/AppURL';

import { FIND_SAMPLES_BY_FILTER_KEY } from '../../app/constants';

import { formatDateTime } from '../../util/Date';

import { EntityDataType } from '../entities/models';

import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { DataClassDataType, SampleTypeDataType } from '../entities/constants';

import { SCHEMAS } from '../../schemas';

import { getSampleFinderLocalStorageKey, isValidFilterFieldSampleFinder, searchFiltersToJson } from './utils';
import { FieldFilter } from './models';
import { SAMPLE_FINDER_SESSION_PREFIX } from './constants';
import { useAppContext } from '../../AppContext';
import {DisableableMenuItem} from "../samples/DisableableMenuItem";
import {DisableableButton} from "../buttons/DisableableButton";

const DISABLED_FIND_DERIVATIVES_MSG = 'Unable to find derivative samples using filters on multi-valued lookup fields';

const getFieldFilter = (model: QueryModel, filter: Filter.IFilter): FieldFilter => {
    const colName = filter.getColumnName();
    const column = model.getColumn(colName);

    return {
        fieldKey: column?.fieldKey ?? colName,
        fieldCaption: column?.caption ?? colName,
        filter,
        jsonType: column.isLookup() ? 'string' : column?.jsonType ?? 'string', // deferring to 'string' for lookups since lookup display columns default to text fields
    } as FieldFilter;
};

interface Props {
    asSubMenu?: boolean;
    baseFilter?: Filter.IFilter[];
    baseModel?: QueryModel;
    entityDataType: EntityDataType;
    metricFeatureArea?: string;
    model: QueryModel;
}

export const FindDerivativesButton: FC<Props> = memo(props => {
    const { baseModel, baseFilter, model, entityDataType, asSubMenu, metricFeatureArea } = props;
    const { api } = useAppContext();

    const viewAndUserFilters = useMemo(
        () => [].concat(model.viewFilters).concat(model.filterArray),
        [model.filterArray, model.viewFilters]
    );
    const invalidFilterNames = useMemo(
        () =>
            viewAndUserFilters
                .map(filter => {
                    const colName = filter.getColumnName();
                    const column = model.getColumn(colName);
                    return !isValidFilterFieldSampleFinder(column, model.queryInfo) ? column.caption : undefined;
                })
                .filter(caption => caption !== undefined)
                .join(', '),
        [model, viewAndUserFilters]
    );

    const onClick = useCallback(() => {
        const currentTimestamp = new Date();
        const sessionViewName = SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(currentTimestamp);

        let fieldFilters = [];
        // optionally include baseFilter when passed without a baseModel (i.e. apply to the same schemaQuery as the other filters)
        if (baseFilter && !baseModel) {
            fieldFilters = fieldFilters.concat(baseFilter.map(filter => getFieldFilter(model, filter)));
        }
        // always include viewFilters and user defined filters (filterArray)
        fieldFilters = fieldFilters.concat(viewAndUserFilters.map(filter => getFieldFilter(model, filter)));

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
        api.query.incrementClientSideMetricCount(metricFeatureArea, 'sampleFinderFindDerivatives');

        window.location.href = AppURL.create('search', FIND_SAMPLES_BY_FILTER_KEY)
            .addParam('view', sessionViewName)
            .toHref();
    }, [api.query, baseFilter, baseModel, entityDataType, metricFeatureArea, model, viewAndUserFilters]);

    if (!model.queryInfo) return null;

    if (asSubMenu) {
        const items = (
            <DisableableMenuItem
                operationPermitted={!invalidFilterNames}
                disabledMessage={DISABLED_FIND_DERIVATIVES_MSG + ' (' + invalidFilterNames + ').'}
                onClick={onClick}
            >
                Find Derivatives
            </DisableableMenuItem>
        );
        return <ResponsiveMenuButton id="samples-finder-menu" items={items} text="Find" asSubMenu={asSubMenu} />;
    }

    return (
        <DisableableButton
            className="responsive-menu"
            bsStyle="default"
            onClick={onClick}
            disabledMsg={invalidFilterNames ? DISABLED_FIND_DERIVATIVES_MSG + ' (' + invalidFilterNames + ').' : undefined}
        >
            Find Derivatives
        </DisableableButton>
    );
});
