import React, { FC, memo, useMemo } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { generateId } from '../../util/utils';

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
    const id = useMemo(() => generateId(), []);

    return (
        <>
            {disabledMsg ? (
                <OverlayTrigger placement="bottom" overlay={<Popover id={id} title={title}>{disabledMsg}</Popover>}>
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
