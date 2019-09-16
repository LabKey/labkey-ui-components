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
import { QueryGridModel, Tip } from '@glass/base'

import { loadPage } from '../../actions'


interface Props {
    model: QueryGridModel
    showCounts?: boolean
}

export class QueryGridPaging extends React.Component<Props, any> {

    static defaultProps = {
        showCounts: true
    };

    constructor(props: Props) {
        super(props);

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
    }

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

    nextPage() {
        const { model } = this.props;
        loadPage(model, model.pageNumber + 1);
    }

    prevPage() {
        const { model } = this.props;
        loadPage(model, model.pageNumber - 1);
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
                        <Tip caption="Previous Page">
                            <Button onClick={this.prevPage} disabled={model.pageNumber <= 1}>
                                <i className="fa fa-chevron-left"/>
                            </Button>
                        </Tip>
                        <Tip caption="Next Page">
                            <Button onClick={this.nextPage} disabled={max === total}>
                                <i className="fa fa-chevron-right"/>
                            </Button>
                        </Tip>
                    </div>
                ) : null}
            </>
        );
    }
}
