/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { fromJS, List } from 'immutable';

import { DetailDisplay, DetailDisplaySharedProps } from '../../internal/components/forms/detail/DetailDisplay';

import { QueryColumn } from '../QueryColumn';
import { Alert } from '../../internal/components/base/Alert';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { QueryConfig } from './QueryModel';

interface DetailPanelProps extends DetailDisplaySharedProps {
    editColumns?: QueryColumn[];
    queryColumns?: QueryColumn[];
}

type RequiresModel = Pick<RequiresModelAndActions, 'model'>;

/**
 * Render a QueryModel with a single row of a data. For in-depth documentation and examples see
 * components/docs/QueryModel.md.
 */
export const DetailPanel: FC<DetailPanelProps & RequiresModel> = memo(props => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { editColumns, model, queryColumns, ...detailDisplayProps } = props;
    const { editingMode } = detailDisplayProps;
    const error = model.queryInfoError ?? model.rowsError;
    let displayColumns: List<QueryColumn>;

    if (error !== undefined) {
        return <Alert bsStyle="info">{error}</Alert>;
    } else if (model.isLoading) {
        return <LoadingSpinner />;
    }

    if (editingMode) {
        displayColumns = List(editColumns ?? model.updateColumns);
    } else {
        displayColumns = List(queryColumns ?? model.detailColumns);
    }

    return <DetailDisplay {...detailDisplayProps} data={fromJS(model.gridData)} displayColumns={displayColumns} />;
});

const DetailPanelWithModelBodyImpl: FC<DetailPanelProps & InjectedQueryModels> = memo(({ queryModels, ...rest }) => {
    return <DetailPanel {...rest} model={queryModels.model} />;
});

const DetailPanelWithModelBody = withQueryModels<DetailPanelProps>(DetailPanelWithModelBodyImpl);

interface DetailPanelWithModelProps extends DetailPanelProps {
    queryConfig: QueryConfig;
}

export const DetailPanelWithModel: FC<DetailPanelWithModelProps> = memo(props => {
    const { queryConfig, ...detailPanelProps } = props;
    const queryConfigs = useMemo(() => ({ model: queryConfig }), [queryConfig]);
    const { keyValue, schemaQuery } = queryConfig;
    const { schemaName, queryName } = schemaQuery;
    // Key is used here to ensure we re-mount the DetailPanel when the queryConfig changes
    const key = useMemo(() => `${schemaName}.${queryName}.${keyValue}`, [schemaQuery, keyValue]);

    return <DetailPanelWithModelBody {...detailPanelProps} autoLoad key={key} queryConfigs={queryConfigs} />;
});
