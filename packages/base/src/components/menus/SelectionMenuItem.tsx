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
import * as React from 'react'
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap'
import { QueryGridModel } from "../../models/model";

interface Props {
    id: string
    model: QueryGridModel
    text: string
    onClick: () => any
    disabledMsg: string
}

export class SelectionMenuItem extends React.Component<Props, any> {

    static defaultProps = {
        disabledMsg: 'Select one or more items'
    };

    render() {
        const { id, model, text, onClick, disabledMsg } = this.props;
        const disabled = !model || model.totalRows === 0 || model.selectedIds.size === 0;
        const item = <MenuItem onClick={onClick} disabled={disabled}>{text}</MenuItem>;

        if (disabled) {
            const overlay = <Popover id={id + "-disabled-warning"}>{disabledMsg}</Popover>;

            return (
                <OverlayTrigger overlay={overlay} placement="right">
                    {item}
                </OverlayTrigger>
            )
        }

        return item;
    }
}
