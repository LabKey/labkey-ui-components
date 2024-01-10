import React, { FC, memo, ReactNode, useMemo } from 'react';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { generateId } from '../../util/utils';

interface Props {
    iconComponent?: ReactNode; // use a different icon than the question mark circle
    id?: string;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    popoverClassName?: string; // is placed on the popover container
    required?: boolean; // will add required message at bottom of help tooltip
    title?: string;
}

export const LabelHelpTip: FC<Props> = memo(props => {
    const { children, title, placement, id = 'label-help-tip', required, iconComponent, popoverClassName } = props;
    const id_ = useMemo(() => generateId(id), [id]);
    const popover = useMemo(
        () => (
            <Popover id={id_} title={title} className={popoverClassName} placement={placement}>
                {children}
                {required && <div className="label-help-required">This field is required.</div>}
            </Popover>
        ),
        [children, id, placement, popoverClassName, required, title]
    );
    // Need to have both icon and overlay inside mouse handlers div so overlay stays visible when moused over
    return (
        <OverlayTrigger id={id_} overlay={popover}>
            <span className="label-help-target">
                {iconComponent ?? <span className="label-help-icon fa fa-question-circle" />}
            </span>
        </OverlayTrigger>
    );
});

LabelHelpTip.displayName = 'LabelHelpTip';
