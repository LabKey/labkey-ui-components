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
import React from 'reactn'
import { Button } from 'react-bootstrap'
import { GRID_CHECKBOX_OPTIONS, QueryGridModel } from '@glass/base'

import { gridSelectAll } from '../../actions'

interface Props {
    containerCls?: string
    model: QueryGridModel
}

export class GridSelectionBanner extends React.Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.selectAll = this.selectAll.bind(this)
    }

    selectAll()
    {
        gridSelectAll(this.props.model);
    }

    render() {
        const { containerCls, model } = this.props;
        if (model && model.isLoaded) {
            const {maxRows, selectedQuantity, selectedState, totalRows} = model;

            const allOnModel = selectedQuantity === totalRows && totalRows > 0,
                allOnPage = selectedState === GRID_CHECKBOX_OPTIONS.ALL,
                hasMessage = (allOnModel || allOnPage) && totalRows > maxRows;

            let message;

            if (allOnModel) {
                message = (
                    <span>All {selectedQuantity} selected</span>
                )
            } else if (allOnPage && !allOnModel) {
                message = (
                    <span>
                    Selected all {selectedQuantity} on this page &nbsp;
                        <Button bsSize={'xsmall'} onClick={this.selectAll}>Select all {totalRows}</Button>
                </span>
                )
            }

            if (hasMessage) {
                return (
                    <div className={containerCls}>{message}</div>
                )
            }
        }

        return null;
    }
}