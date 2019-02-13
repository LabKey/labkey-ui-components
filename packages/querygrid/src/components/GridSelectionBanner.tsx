/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Button } from 'react-bootstrap'
import { GRID_CHECKBOX_OPTIONS, QueryGridModel } from '@glass/models'

import { gridSelectAll } from '../actions'

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