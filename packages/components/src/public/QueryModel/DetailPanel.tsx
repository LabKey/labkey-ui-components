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
import { Alert } from 'react-bootstrap';

import { LoadingSpinner, QueryColumn, QueryConfig, RequiresModelAndActions } from '../..';

import { DetailDisplay, DetailDisplaySharedProps } from '../../internal/components/forms/detail/DetailDisplay';

import { InjectedQueryModels, withQueryModels } from './withQueryModels';

interface DetailPanelProps extends DetailDisplaySharedProps, RequiresModelAndActions {
    queryColumns?: QueryColumn[];
}

export const DetailPanel: FC<DetailPanelProps> = memo(({ actions, model, queryColumns, ...detailDisplayProps }) => {
    // ignoring actions so we don't pass to DetailDisplay
    const { editingMode } = detailDisplayProps;
    const error = model.queryInfoError ?? model.rowsError;
    let displayColumns: List<QueryColumn>;

    if (error !== undefined) {
        return <Alert>{error}</Alert>;
    } else if (model.isLoading) {
        return <LoadingSpinner />;
    }

    if (queryColumns !== undefined) {
        displayColumns = List(queryColumns);
    } else {
        displayColumns = List(editingMode ? model.updateColumns : model.detailColumns);
    }

    return <DetailDisplay {...detailDisplayProps} data={fromJS(model.gridData)} displayColumns={displayColumns} />;
});

interface DetailPanelWithModelProps extends DetailDisplaySharedProps {
    queryColumns?: QueryColumn[];
}

const DetailPanelWithModelBodyImpl: FC<DetailPanelWithModelProps & InjectedQueryModels> = memo(({ queryModels, ...rest }) => {
    return <DetailPanel {...rest} model={queryModels.model} />;
});

const DetailPanelWithModelBody = withQueryModels<DetailPanelWithModelProps>(DetailPanelWithModelBodyImpl);

export const DetailPanelWithModel: FC<QueryConfig & DetailDisplaySharedProps> = memo(({ asPanel, detailRenderer, editingMode, titleRenderer, useDatePicker, ...queryConfig }) => {
    const queryConfigs = useMemo(() => ({ model: queryConfig }), [ queryConfig ]);
    const { keyValue, schemaQuery } = queryConfig;
    // Key is used here to ensure we re-mount the DetailPanel when the queryConfig changes
    const key = useMemo(() => `${schemaQuery.schemaName}.${schemaQuery.queryName}.${keyValue}`, [schemaQuery, keyValue]);

    return (
        <DetailPanelWithModelBody
            asPanel={asPanel}
            autoLoad
            detailRenderer={detailRenderer}
            editingMode={editingMode}
            key={key}
            queryConfigs={queryConfigs}
            titleRenderer={titleRenderer}
            useDatePicker={useDatePicker}
        />
    );
});


// TODO: convert props to match GridPanelWithModel so that DetailPanelWithModel takes a queryConfig instead union QueryConfig
