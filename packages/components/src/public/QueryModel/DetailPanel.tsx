/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
