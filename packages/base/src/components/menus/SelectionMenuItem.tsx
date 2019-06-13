/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
