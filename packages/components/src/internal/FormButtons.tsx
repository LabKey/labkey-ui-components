import classNames from 'classnames';
import React, { Children, FC, memo } from 'react';

interface Props {
    sticky?: boolean;
}

export const FormButtons: FC<Props> = memo(({ children, sticky = true }) => {
    const className = classNames('form-buttons', { 'form-buttons--sticky': sticky });
    let cancel;
    let secondary;
    let tertiary;
    let submit;

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

    return (
        <div className={className}>
            <div className="form-buttons__left">{cancel}</div>
            <div className="form-buttons__right">
                {secondary}
                {tertiary}
                {submit}
            </div>
        </div>
    );
});
