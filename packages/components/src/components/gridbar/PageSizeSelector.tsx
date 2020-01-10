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
import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';
import { Tip } from '../base/Tip';
import { QueryGridModel } from '../base/models/model';
import { setMaxRows } from "../../actions";


/**
 * @model the query grid model from which to export
 * @supportedTypes the types of export formats supported.  Default is CSV, EXCEL and TSV.
 */
interface Props {
    model: QueryGridModel
    options?: List<number>
}

/**
 * Displays a dropdown button with the different supported page size options. The default, from getStateQueryGridModel, is 20.
 */
export class PageSizeSelector extends React.PureComponent<Props, any> {

    static defaultProps = {
        options: List.of(20, 40, 100, 250, 400)
    };

    onClick(selectedVal: number) {
        setMaxRows(this.props.model, selectedVal);
    }

    render() {
        const { model, options } = this.props;
        const showSelector = model && model.totalRows > options.get(0);

        return (showSelector &&
            <span className={'gridbar-button-spacer'}>
                <Tip caption="Page Size" trigger={['hover']}>
                    <DropdownButton
                        id={`page-size-drop-${model.getId()}`}
                        pullRight
                        title={model.maxRows}
                        disabled={model.isError || !model.isPaged}
                    >
                        <MenuItem header>Page Size</MenuItem>
                        {options.map((option, index) =>
                            <MenuItem
                                key={index}
                                active={option === model.maxRows}
                                onClick={() => this.onClick(option)}
                            >
                                {option}
                            </MenuItem>
                        )}
                    </DropdownButton>
                </Tip>
            </span>
        )
    }
}
