/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import classNames from 'classnames';
import { ButtonGroup } from 'react-bootstrap';

import { DisableableButton } from '../buttons/DisableableButton';

interface Props {
    id: number;
    display: string;
    onRemove?: (userId: number) => void;
    onClick: (userId: number) => void;
    bsStyle?: string;
    added?: boolean;
    disabledMsg?: string;
}

interface State {
    removed: boolean;
}

export class RemovableButton extends React.PureComponent<Props, State> {
    static defaultProps = {
        bsStyle: 'default',
    };

    state: Readonly<State> = { removed: false };

    onClick = (): void => {
        const { id, onClick } = this.props;
        onClick?.(id);
    };

    onRemoveClick = (): void => {
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

    onRemove = (): void => {
        const { id, onRemove } = this.props;
        onRemove?.(id);
    };

    render() {
        const { display, bsStyle, added, disabledMsg, onRemove } = this.props;

        const btn = (
            <button
                className={classNames(`permissions-button-display btn btn-${bsStyle}`, {
                    'permissions-button-added': added,
                })}
                onClick={this.onClick}
                type="button"
            >
                {display}
            </button>
        );

        return (
            <>
                {onRemove ? (
                    <ButtonGroup
                        className={classNames('permissions-button-group', {
                            'permissions-button-removed': this.state.removed,
                        })}
                    >
                        <DisableableButton disabledMsg={disabledMsg} onClick={this.onRemoveClick} bsStyle={bsStyle}>
                            <i className="fa fa-remove" />
                        </DisableableButton>
                        {btn}
                    </ButtonGroup>
                ) : (
                    btn
                )}
            </>
        );
    }
}
