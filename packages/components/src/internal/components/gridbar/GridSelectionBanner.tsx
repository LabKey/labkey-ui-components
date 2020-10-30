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
import React, { Component, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { Map } from 'immutable';

import { gridClearAll, gridSelectAll } from '../../actions';
import { QueryGridModel } from '../../..';

interface Props {
    containerCls?: string;
    model: QueryGridModel;
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any;
}

export class GridSelectionBanner extends Component<Props> {
    selectAll = (): void => {
        gridSelectAll(this.props.model, this.props.onSelectionChange);
    };

    clearAll = (): void => {
        gridClearAll(this.props.model, this.props.onSelectionChange);
    };

    render(): ReactNode {
        const { containerCls, model } = this.props;
        if (model && model.isLoaded && model.selectedLoaded) {
            const { maxRows, totalRows } = model;

            const selectedCount = model.selectedQuantity;

            const allOnModel = selectedCount === totalRows && totalRows > 0;

            const clearText =
                selectedCount === 1 ? 'Clear' : selectedCount === 2 ? 'Clear both' : 'Clear all ' + selectedCount;

            return (
                <div className={containerCls}>
                    {selectedCount > 0 && (
                        <span className="QueryGrid-right-spacing">
                            {selectedCount} of {totalRows} selected
                        </span>
                    )}
                    {!allOnModel && totalRows > maxRows && (
                        <span className="QueryGrid-right-spacing">
                            {' '}
                            <Button bsSize="xsmall" onClick={this.selectAll}>
                                Select all {totalRows}
                            </Button>
                        </span>
                    )}
                    {selectedCount > 0 && (
                        <Button bsSize="xsmall" onClick={this.clearAll}>
                            {clearText}
                        </Button>
                    )}
                </div>
            );
        }

        return null;
    }
}
