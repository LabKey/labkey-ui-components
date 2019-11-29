/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Button, ButtonGroup } from "react-bootstrap";

interface Props {
    id: number
    display: string
    onRemove: (userId: number) => any
    onClick: (userId: number) => any
    bsStyle?: string
}

export class RemovableButton extends React.PureComponent<Props, any> {

    render() {
        const { id, display, onClick, onRemove, bsStyle } = this.props;

        return (
            <ButtonGroup className={'permissions-principal-button-group'}>
                <Button bsStyle={bsStyle} onClick={() => onRemove(id)}><i className={'fa fa-remove'}/></Button>
                <Button bsStyle={bsStyle} onClick={() => onClick(id)}>{display}</Button>
            </ButtonGroup>
        )
    }
}