/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Button } from 'react-bootstrap'

import { Tip } from './components/Tip'
import { QueryGridModel } from './model'
import { loadPage } from './actions'


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
                    <span className="paging-counts" style={showButtons ? {paddingRight: '10px'} : {marginTop: '8px', display: 'inline-block'}}
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
