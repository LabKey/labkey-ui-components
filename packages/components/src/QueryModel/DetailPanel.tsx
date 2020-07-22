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
import React, { PureComponent, ReactNode } from 'react';
import { fromJS, List } from 'immutable';
import { Alert } from 'react-bootstrap';

import { LoadingSpinner, QueryColumn, QueryConfig, RequiresModelAndActions } from '..';

import { DetailDisplay, DetailDisplaySharedProps } from '../components/forms/detail/DetailDisplay';

import { InjectedQueryModels, withQueryModels } from './withQueryModels';

interface DetailPanelProps extends DetailDisplaySharedProps, RequiresModelAndActions {
    queryColumns?: List<QueryColumn>;
}

export class DetailPanel extends PureComponent<DetailPanelProps> {
    render(): ReactNode {
        // ignoring actions so we don't pass to DetailDisplay
        const { actions, model, queryColumns, ...detailDisplayProps } = this.props;
        const { editingMode } = detailDisplayProps;
        const error = model.queryInfoError ?? model.rowsError;

        if (error !== undefined) {
            return <Alert>{error}</Alert>;
        } else if (model.isLoading) {
            return <LoadingSpinner />;
        }

        return (
            <DetailDisplay
                {...detailDisplayProps}
                data={fromJS(model.gridData)}
                displayColumns={queryColumns ?? List(editingMode ? model.updateColumns : model.detailColumns)}
            />
        );
    }
}

interface DetailPanelWithModelProps extends DetailDisplaySharedProps {
    queryColumns?: List<QueryColumn>;
}

class DetailPanelWithModelBodyImpl extends PureComponent<DetailPanelWithModelProps & InjectedQueryModels> {
    render(): ReactNode {
        const { queryModels, ...rest } = this.props;
        return <DetailPanel {...rest} model={queryModels.model} />;
    }
}

const DetailPanelWithModelBody = withQueryModels<DetailPanelWithModelProps>(DetailPanelWithModelBodyImpl);

export class DetailPanelWithModel extends PureComponent<QueryConfig & DetailDisplaySharedProps> {
    render(): ReactNode {
        const { asPanel, detailRenderer, editingMode, titleRenderer, useDatePicker, ...queryConfig } = this.props;
        const queryConfigs = { model: queryConfig };
        const { keyValue, schemaQuery } = queryConfig;
        // Key is used here to ensure we re-mount the DetailPanel when the queryConfig changes
        const key = `${schemaQuery.schemaName}.${schemaQuery.queryName}.${keyValue}`;

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
    }
}
