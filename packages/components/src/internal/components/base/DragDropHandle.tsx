import React, { FC, memo, useMemo } from 'react';
import classNames from 'classnames';

import { Popover } from '../../Popover';
import { generateId } from '../../util/utils';
import { OverlayTrigger } from '../../OverlayTrigger';

interface Props {
    highlighted: boolean;
    tooltip?: string;
}

export const DragDropHandle: FC<Props> = memo(({ highlighted, tooltip }) => {
    const id = useMemo(() => generateId(), []);
    const className = classNames('drag-drop-handle', {
        'field-highlighted': highlighted,
    });

    const body = (
        <div className={className}>
            <span className="fa fa-ellipsis-v" />
            <span className="fa fa-ellipsis-v" />
        </div>
    );

    if (!tooltip) {
        return body;
    }

    return (
        <OverlayTrigger
            overlay={
                <Popover id={id} placement="right">
                    {tooltip}
                </Popover>
            }
        >
            {body}
        </OverlayTrigger>
    );
});
