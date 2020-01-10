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
import React from 'reactn';
import { Button } from 'react-bootstrap';

import { loadPage } from '../../actions';
import { Tip } from '../base/Tip';
import { QueryGridModel } from '../base/models/model';


interface Props {
    model: QueryGridModel
    showCounts?: boolean
}

export class QueryGridPaging extends React.Component<Props, any> {

    static defaultProps = {
        showCounts: true
    };

    shouldComponentUpdate(nextProps: Props) {
        const { model } = this.props;
        const nextModel = nextProps.model;

        return !(
            model.isPaged === nextModel.isPaged &&
            model.totalRows === nextModel.totalRows &&
            model.selectedState === nextModel.selectedState &&
            model.getMinRowIndex() === nextModel.getMinRowIndex() &&
            model.getMaxRowIndex() === nextModel.getMaxRowIndex()
        );
    }

    nextPage = () => {
        const { model } = this.props;
        loadPage(model, model.pageNumber + 1);
    };

    prevPage = () => {
        const { model } = this.props;
        loadPage(model, model.pageNumber - 1);
    };

    renderNextPrevButton(faCls: string, disabled: boolean, tooltip: string, onClick: () => any) {
        let btn = (
            <Button onClick={onClick} disabled={disabled}>
                <i className={'fa ' + faCls}/>
            </Button>
        );

        if (disabled) {
            btn = (
                <div className={'disabled-button-with-tooltip'}>
                    {btn}
                </div>
            )
        }

        return (
            <Tip caption={tooltip}>
                {btn}
            </Tip>
        )
    }

    render() {
        const { model, showCounts } = this.props;
        const min = model.getMinRowIndex();
        const max = model.getMaxRowIndex();
        const total = model.totalRows;

        if (!model.isPaged) {
            return null;
        }

        // hidden when "0 of 0" or "1 - N of N"
        const showButtons = !(max === 0 || (min === 1 && max === total));

        return (
            <>
                {showCounts && total != 0 ?
                    <span className={showButtons ? 'paging-counts-with-buttons' : ''}
                          data-min={min} data-max={max} data-total={total}>
                        {min === max ? <span>{max}</span> : <span>{max === 0 ? 0 : min}&nbsp;-&nbsp;{max}</span>} of {total}
                    </span> : null}
                {showButtons ? (
                    <div className="btn-group">
                        {this.renderNextPrevButton('fa-chevron-left', model.pageNumber <= 1, 'Previous Page', this.prevPage)}
                        {this.renderNextPrevButton('fa-chevron-right', max === total, 'Next Page', this.nextPage)}
                    </div>
                ) : null}
            </>
        );
    }
}
