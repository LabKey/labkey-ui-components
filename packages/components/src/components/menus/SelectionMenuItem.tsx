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
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { QueryGridModel } from '../base/models/model';
import { QueryModel } from '../..';

interface Props {
    id: string;
    model?: QueryGridModel;
    queryModel?: QueryModel;
    text: string;
    onClick: () => void;
    disabledMsg: string;
    maxSelection?: number;
    maxSelectionDisabledMsg?: string;
    nounPlural: string;
}

export class SelectionMenuItem extends PureComponent<Props> {
    static defaultProps = {
        disabledMsg: 'Select one or more',
        nounPlural: 'items',
    };

    get tooManySelected(): boolean {
        const { maxSelection, model, queryModel } = this.props;
        const numSelections = model?.selectedIds.size ?? queryModel?.selections?.size;
        return numSelections !== undefined && numSelections > maxSelection;
    }

    get tooFewSelected(): boolean {
        const { model, queryModel } = this.props;
        const numSelections = model?.selectedIds.size ?? queryModel?.selections?.size;
        return numSelections !== undefined && numSelections === 0;
    }

    get disabled(): boolean {
        const { model, queryModel } = this.props;
        const totalRows = model?.totalRows ?? queryModel?.rowCount;
        return totalRows === undefined || this.tooFewSelected || this.tooManySelected;
    }

    render() {
        const { id, text, onClick, disabledMsg, maxSelection, maxSelectionDisabledMsg, nounPlural } = this.props;
        const { disabled, tooFewSelected, tooManySelected } = this;
        const item = (
            <MenuItem onClick={onClick} disabled={disabled}>
                {text}
            </MenuItem>
        );

        const message = tooFewSelected
            ? disabledMsg + ' ' + nounPlural + '.'
            : maxSelectionDisabledMsg || 'At most ' + maxSelection + ' ' + nounPlural + ' can be selected.';

        if (disabled) {
            const overlay = <Popover id={id + '-disabled-warning'}>{message}</Popover>;

            return (
                <OverlayTrigger overlay={overlay} placement="right">
                    {item}
                </OverlayTrigger>
            );
        }

        return item;
    }
}
