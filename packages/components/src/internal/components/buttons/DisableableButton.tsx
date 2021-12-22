import React, { memo, FC } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    bsStyle: string;
    disabledMsg?: string;
    onClick: () => void;
    title?: string;
}

export const DisableableButton: FC<Props> = memo(props => {
    const { bsStyle, disabledMsg, title, onClick, children } = props;

    return (
        <>
            {disabledMsg ? (
                <OverlayTrigger placement="bottom" overlay={<Popover title={title}>{disabledMsg}</Popover>}>
                    <div className="disabled-button-with-tooltip">
                        <Button bsStyle={bsStyle} disabled>
                            {children}
                        </Button>
                    </div>
                </OverlayTrigger>
            ) : (
                <Button bsStyle={bsStyle} onClick={onClick}>
                    {children}
                </Button>
            )}
        </>
    );
});
