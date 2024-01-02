import React, { memo, FC } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    bsStyle?: string;
    className?: string;
    disabledMsg?: string;
    onClick?: () => void;
    title?: string;
}

export const DisableableButton: FC<Props> = memo(props => {
    const { bsStyle = 'default', className = '', disabledMsg, title, onClick, children } = props;

    return (
        <>
            {disabledMsg ? (
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Popover id="disabled-button-popover" title={title}>
                            {disabledMsg}
                        </Popover>
                    }
                >
                    <div className={'disabled-button-with-tooltip ' + className}>
                        <button className={`btn btn-${bsStyle}`} disabled type="button">
                            {children}
                        </button>
                    </div>
                </OverlayTrigger>
            ) : (
                <button className={`${className} btn btn-${bsStyle}`} onClick={onClick} type="button">
                    {children}
                </button>
            )}
        </>
    );
});

DisableableButton.displayName = 'DisableableButton';
