/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import classNames from 'classnames';
import React, { Children, FC, memo, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { useModalFooterSlot } from './ModalFooterSlot';
import { useFormStepActive } from './components/forms/FormStep';

interface Props extends PropsWithChildren {
    sticky?: boolean;
}

export const FormButtons: FC<Props> = memo(({ children, sticky = true }) => {
    // When rendered inside a Modal with "footerSlot" enabled, the buttons portal into the modal footer instead
    // of rendering inline.
    const slot = useModalFooterSlot();
    const stepActive = useFormStepActive() ?? true;
    const inSlotMode = slot !== undefined;
    const className = classNames('form-buttons', { 'form-buttons--sticky': sticky && !inSlotMode });
    let cancel;
    let secondary;
    let tertiary;
    let submit;

    if (inSlotMode && (!stepActive || slot === null)) {
        return null;
    }

    // Note: we have to filter children via forEach because doing something like {canSubmit && <button>Submit</button>}
    // counts as a child, even when canSubmit is false, which results in a null child.
    const actualChildren = [];
    Children.forEach(children, child => {
        if (child !== null) actualChildren.push(child);
    });
    const childCount = actualChildren.length;
    // Note: we split children into separate variables because if we just split the children into two arrays consumers
    // would need to remember to supply a key prop for each button, which is easy to forget, and would result in
    // warnings from React.
    if (childCount === 0) {
        return null;
    } else if (childCount === 1) {
        submit = actualChildren;
    } else if (childCount === 2) {
        cancel = actualChildren[0];
        submit = actualChildren[1];
    } else if (childCount === 3) {
        cancel = actualChildren[0];
        secondary = actualChildren[1];
        submit = actualChildren[2];
    } else if (childCount === 4) {
        cancel = actualChildren[0];
        secondary = actualChildren[1];
        tertiary = actualChildren[2];
        submit = actualChildren[3];
    } else {
        console.error(`Invalid number of children (${childCount}) passed to FormButtons, not rendering`);
        return null;
    }

    const content = (
        <div className={className}>
            <div className="form-buttons__left">{cancel}</div>
            <div className="form-buttons__right">
                {secondary}
                {tertiary}
                {submit}
            </div>
        </div>
    );

    return inSlotMode ? createPortal(content, slot) : content;
});
FormButtons.displayName = 'FormButtons';
