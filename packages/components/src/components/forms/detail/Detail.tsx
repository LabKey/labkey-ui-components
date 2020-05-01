/*
 * Copyright (c) 2019 LabKey Corporation
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
import { List } from 'immutable';

import { LoadingSpinner, QueryColumn, QueryGridModel } from '../../..';

import { DetailDisplay, DetailDisplaySharedProps } from './DetailDisplay';

interface DetailProps extends DetailDisplaySharedProps {
    queryModel?: QueryGridModel;
    queryColumns?: List<QueryColumn>;
}

export class Detail extends PureComponent<DetailProps> {
    get detailDisplayProps(): DetailDisplaySharedProps {
        const { queryColumns, queryModel, ...detailDisplayProps } = this.props;
        return detailDisplayProps;
    }

    render() {
        const { editingMode, queryColumns, queryModel } = this.props;

        if (queryModel && queryModel.isLoaded) {
            let displayColumns: List<QueryColumn>;
            if (queryColumns) {
                displayColumns = queryColumns;
            } else if (editingMode) {
                displayColumns = queryModel.getUpdateDisplayColumns();
            } else {
                displayColumns = queryModel.getDetailsDisplayColumns();
            }

            return (
                <DetailDisplay
                    {...this.detailDisplayProps}
                    data={queryModel.getData()}
                    displayColumns={displayColumns}
                />
            );
        }

        return <LoadingSpinner />;
    }
}
