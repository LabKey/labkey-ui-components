import React, { FC, memo, useMemo } from 'react';

import { generateId } from '../../util/utils';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';

interface Props {
    className?: string;
    disabledMsg?: string;
    name: string;
    onChange: (evt: any) => void;
    placeholder?: string;
    title?: string;
    value: string;
}

export const DisableableInput: FC<Props> = memo(props => {
    const { disabledMsg, title, ...inputProps } = props;
    const id = useMemo(() => generateId(), []);

    return (
        <>
            {disabledMsg ? (
                <OverlayTrigger
                    style={{ display: 'inline' }}
                    overlay={
                        <Popover id={id} title={title} placement="bottom">
                            {disabledMsg}
                        </Popover>
                    }
                >
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
