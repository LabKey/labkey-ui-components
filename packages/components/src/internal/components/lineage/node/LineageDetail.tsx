import React, { FC, memo, useMemo } from 'react';
import { Experiment, Filter } from '@labkey/api';
import { List, Map } from 'immutable';

import { Renderer, resolveDetailRenderer } from '../../forms/detail/DetailDisplay';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { Alert } from '../../base/Alert';
import { DetailPanel } from '../../../../public/QueryModel/DetailPanel';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { ViewInfo } from '../../../ViewInfo';
import { QueryColumn } from '../../../../public/QueryColumn';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../../public/QueryModel/withQueryModels';
import { SAMPLE_STATE_COLOR_COLUMN_NAME, SAMPLE_STATE_TYPE_COLUMN_NAME } from '../../samples/constants';

const ADDITIONAL_DETAIL_FIELDS = ['properties'];

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
}

const LineageDetailImpl: FC<InjectedQueryModels & LineageDetailProps> = memo(props => {
    const { queryModels } = props;
    if (queryModels.model.isLoading) return <LoadingSpinner />;
    if (queryModels.model.hasLoadErrors) return <Alert>{queryModels.model.loadErrors[0]}</Alert>;

    // Issue 50537: only show the "Properties" column in the detail view for the exp schema
    const isExpSchema = queryModels.model.schemaName === 'exp';

    const additionalCols = isExpSchema
        ? queryModels.model.allColumns.filter(col => ADDITIONAL_DETAIL_FIELDS.indexOf(col.fieldKey?.toLowerCase()) > -1)
        : [];
    const detailColumns = [...queryModels.model.detailColumns, ...additionalCols];

    return (
        <DetailPanel
            detailRenderer={_resolveDetailRenderer}
            model={queryModels.model}
            queryColumns={detailColumns}
            tableCls="detail-component--table__auto"
        />
    );
});
LineageDetailImpl.displayName = 'LineageDetailImpl';

const LineageDetailWithQueryModels = withQueryModels<LineageDetailProps>(LineageDetailImpl);

export const LineageDetail: FC<LineageDetailProps> = memo(({ item }) => {
    const queryConfigs = useMemo<QueryConfigMap>(() => {
        if (item.restricted) return {};

        return {
            model: {
                baseFilters: item.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)),
                containerPath: item.containerPath,
                // Issue 45028: Display details view columns in lineage
                schemaQuery: new SchemaQuery(item.schemaName, item.queryName, ViewInfo.DETAIL_NAME),
                // Must specify '*' columns be requested to resolve "properties" columns
                requiredColumns: ['*', SAMPLE_STATE_COLOR_COLUMN_NAME, SAMPLE_STATE_TYPE_COLUMN_NAME],
            },
        };
    }, [item]);

    if (item.restricted) {
        return <Alert bsStyle="info">This {item.name} cannot be viewed.</Alert>;
    }

    // providing "key" to allow for reload on lsid change
    return <LineageDetailWithQueryModels autoLoad item={item} key={item.lsid} queryConfigs={queryConfigs} />;
});
LineageDetail.displayName = 'LineageDetail';

interface RendererProps {
    data: List<Map<string, any>>;
}

// exported for jest testing
export const CustomPropertiesRenderer: FC<RendererProps> = memo(({ data }) => {
    return (
        <table className="lineage-detail-prop-table" data-testid="custom-properties-table">
            <tbody>
                {data
                    ?.map(row => {
                        const fieldKey = row.get('fieldKey');
                        const name = fieldKey.substring(fieldKey.indexOf('#') + 1);

                        return (
                            <tr className="lineage-detail-prop-row" key={fieldKey}>
                                <td className="lineage-detail-prop-cell">{name}</td>
                                <td className="lineage-detail-prop-cell">{row.get('value')}</td>
                            </tr>
                        );
                    })
                    .toArray()}
            </tbody>
        </table>
    );
});
CustomPropertiesRenderer.displayName = 'CustomPropertiesRenderer';

function _resolveDetailRenderer(column: QueryColumn): Renderer {
    if (column.fieldKey.toLowerCase() === 'properties') {
        return d => <CustomPropertiesRenderer data={d} />;
    }

    return resolveDetailRenderer(column);
}
