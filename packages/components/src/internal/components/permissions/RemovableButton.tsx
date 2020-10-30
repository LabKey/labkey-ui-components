/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { List } from 'immutable';

import { Tip } from '../../..';

interface Props {
    id: number;
    display: string;
    onRemove?: (userId: number) => any;
    onClick: (userId: number) => any;
    bsStyle?: string;
    added?: boolean;
    disabledMsg?: string;
}

interface State {
    removed: boolean;
}

export class RemovableButton extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            removed: false,
        };
    }

    onRemoveClick = () => {
        if (!this.state.removed) {
            // set the button state as removed and then wait for fade out animation before calling onRemove
            this.setState(
                () => ({ removed: true }),
                () => {
                    window.setTimeout(this.onRemove, 500);
                }
            );
        }
    };

    onRemove = () => {
        const { id, onRemove } = this.props;
        if (onRemove) {
            onRemove(id);
        }
    };

    render() {
        const { id, display, onClick, bsStyle, added, disabledMsg, onRemove } = this.props;

        let btnGroupCls = List<string>(['permissions-button-group']);
        if (this.state.removed) {
            btnGroupCls = btnGroupCls.push('permissions-button-removed');
        }

        let btnCls = List<string>(['permissions-button-display']);
        if (added) {
            btnCls = btnCls.push('permissions-button-added');
        }

        const btn = (
            <Button className={btnCls.join(' ')} bsStyle={bsStyle} onClick={() => onClick(id)}>
                {display}
            </Button>
        );

        return (
            <>
                {onRemove ? (
                    <ButtonGroup className={btnGroupCls.join(' ')}>
                        {disabledMsg ? (
                            <Tip caption={disabledMsg}>
                                <div className="disabled-button-with-tooltip">
                                    <Button bsStyle={bsStyle} disabled={true}>
                                        <i className="fa fa-remove" />
                                    </Button>
                                </div>
                            </Tip>
                        ) : (
                            <Button bsStyle={bsStyle} onClick={this.onRemoveClick}>
                                <i className="fa fa-remove" />
                            </Button>
                        )}
                        {btn}
                    </ButtonGroup>
                ) : (
                    btn
                )}
            </>
        );
    }
}
