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

import { LoadingSpinner, QueryColumn } from '..';

import { DetailDisplay, DetailDisplaySharedProps } from '../components/forms/detail/DetailDisplay';

import { QueryModel } from './QueryModel';
import { InjectedQueryModels, withQueryModels } from './withQueryModels';

interface DetailPanelWithModelProps extends DetailDisplaySharedProps {
    queryColumns?: List<QueryColumn>;
}

class DetailPanelWithModelImpl extends PureComponent<DetailPanelWithModelProps & InjectedQueryModels> {
    componentDidMount(): void {
        const { actions } = this.props;
        actions.loadModel(this.getModel().id);
    }

    getModel(): QueryModel {
        const { queryModels } = this.props;
        return queryModels[Object.keys(queryModels)[0]];
    }

    get detailDisplayProps(): DetailDisplaySharedProps {
        // Purposely not using queryColumns, queryModels, do not want to pass to DetailDisplay
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { queryColumns, queryModels, ...detailDisplayProps } = this.props;
        return detailDisplayProps;
    }

    render(): ReactNode {
        const { editingMode, queryColumns } = this.props;
        const model = this.getModel();
        const error = model.queryInfoError ?? model.rowsError;

        if (error !== undefined) {
            return <Alert>{error}</Alert>;
        } else if (model.isLoading) {
            return <LoadingSpinner />;
        }

        return (
            <DetailDisplay
                {...this.detailDisplayProps}
                data={fromJS(model.gridData)}
                displayColumns={queryColumns ?? List(editingMode ? model.updateColumns : model.detailColumns)}
            />
        );
    }
}

export const DetailPanelWithModel = withQueryModels<DetailPanelWithModelProps>(DetailPanelWithModelImpl);
