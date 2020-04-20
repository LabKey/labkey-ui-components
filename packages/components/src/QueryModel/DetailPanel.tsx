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
import React, { PureComponent } from 'react';
import { fromJS, List } from 'immutable';
import { Alert } from 'react-bootstrap';

import { LoadingSpinner } from '..';

import { DetailDisplay, DetailDisplaySharedProps } from '../components/forms/detail/DetailDisplay';

import { QueryModel } from './QueryModel';
import { InjectedQueryModels, withQueryModels } from './withQueryModels';

class DetailPanelWithModelImpl extends PureComponent<DetailDisplaySharedProps & InjectedQueryModels> {
    componentDidMount(): void {
        const { actions } = this.props;
        actions.loadModel(this.getModel().id);
    }

    getModel(): QueryModel {
        const { queryModels } = this.props;
        return queryModels[Object.keys(queryModels)[0]];
    }

    render() {
        const { editingMode } = this.props;
        const model = this.getModel();

        if (model.error !== undefined) {
            return <Alert>{model.error}</Alert>;
        } else if (model.isLoading) {
            return <LoadingSpinner />;
        }

        return (
            <DetailDisplay
                {...this.props}
                data={fromJS(model.gridData)}
                displayColumns={List(editingMode ? model.updateColumns : model.detailColumns)}
            />
        );
    }
}

export const DetailPanelWithModel = withQueryModels<DetailDisplaySharedProps>(DetailPanelWithModelImpl);
