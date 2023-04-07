import React, { memo, FC } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    bsStyle?: string;
    className?: string;
    disabledMsg?: string;
    onClick?: () => void;
    title?: string;
}

export const DisableableButton: FC<Props> = memo(props => {
    const { bsStyle, className = '', disabledMsg, title, onClick, children } = props;

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
                        <Button bsStyle={bsStyle} disabled>
                            {children}
                        </Button>
                    </div>
                </OverlayTrigger>
            ) : (
                <Button bsStyle={bsStyle} className={className} onClick={onClick}>
                    {children}
                </Button>
            )}
        </>
    );
});
