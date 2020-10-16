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

import { InjectedQueryModels, LoadingSpinner, QueryColumn, QueryConfig, RequiresModelAndActions, withQueryModels } from '../..';

import { DetailDisplay, DetailDisplaySharedProps } from '../../internal/components/forms/detail/DetailDisplay';

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

interface DetailPanelBodyProps extends DetailDisplaySharedProps {
    queryColumns?: QueryColumn[];
}

const DetailPanelWithModelBodyImpl: FC<DetailPanelBodyProps & InjectedQueryModels> = memo(({ queryModels, ...rest }) => {
    return <DetailPanel {...rest} model={queryModels.model} />;
});

const DetailPanelWithModelBody = withQueryModels<DetailPanelBodyProps>(DetailPanelWithModelBodyImpl);

interface DetailPanelWithModelProps extends DetailDisplaySharedProps {
    queryConfig: QueryConfig;
}

export const DetailPanelWithModel: FC<DetailPanelWithModelProps> = memo(({ asPanel, detailRenderer, editingMode, titleRenderer, useDatePicker, queryConfig }) => {
    const queryConfigs = useMemo(() => ({ model: queryConfig }), [ queryConfig ]);
    const { keyValue, schemaQuery } = queryConfig;
    const { schemaName, queryName } = schemaQuery;
    // Key is used here to ensure we re-mount the DetailPanel when the queryConfig changes
    const key = useMemo(() => `${schemaName}.${queryName}.${keyValue}`, [schemaQuery, keyValue]);

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
