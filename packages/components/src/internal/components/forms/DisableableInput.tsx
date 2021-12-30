import React, { memo, FC } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    className?: string;
    disabledMsg?: string;
    name: string;
    placeholder?: string;
    onChange: (evt: any) => void;
    title?: string;
    value: string;
}

export const DisableableInput: FC<Props> = memo(props => {
    const { disabledMsg, title, ...inputProps } = props;

    return (
        <>
            {disabledMsg ? (
                <OverlayTrigger placement="bottom" overlay={<Popover title={title}>{disabledMsg}</Popover>}>
                    <div className="disabled-button-with-tooltip full-width">
                        <input {...inputProps} type="text" disabled />
                    </div>
                </OverlayTrigger>
            ) : (
                <input {...inputProps} type="text" />
            )}
        </>
    );
});
