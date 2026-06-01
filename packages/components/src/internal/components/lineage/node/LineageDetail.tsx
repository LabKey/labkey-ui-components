/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Experiment } from '@labkey/api';
import { List, Map } from 'immutable';

import { Renderer, resolveDetailRenderer } from '../../forms/detail/DetailDisplay';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { Alert } from '../../base/Alert';
import { DetailPanel } from '../../../../public/QueryModel/DetailPanel';
import { QueryColumn } from '../../../../public/QueryColumn';
import { QueryModel } from '../../../../public/QueryModel/QueryModel';

const ADDITIONAL_DETAIL_FIELDS = ['properties'];

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
    model: QueryModel;
}

export const LineageDetail: FC<LineageDetailProps> = memo(({ item, model }) => {
    if (item.restricted) {
        return <Alert bsStyle="info">This {item.name} cannot be viewed.</Alert>;
    }

    if (model.isLoading) return <LoadingSpinner />;
    if (model.hasLoadErrors) return <Alert>{model.loadErrors[0]}</Alert>;

    // Issue 50537: only show the "Properties" column in the detail view for the exp schema
    const isExpSchema = model.schemaName === 'exp';
    const additionalCols = isExpSchema
        ? model.allColumns.filter(col => ADDITIONAL_DETAIL_FIELDS.indexOf(col.fieldKey?.toLowerCase()) > -1)
        : [];
    const detailColumns = [...model.detailColumns, ...additionalCols];

    return (
        <DetailPanel
            detailRenderer={_resolveDetailRenderer}
            model={model}
            queryColumns={detailColumns}
            tableCls="detail-component--table__auto"
        />
    );
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
