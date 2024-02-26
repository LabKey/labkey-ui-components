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
    const childCount = Children.count(children);

    // Note: we split children into separate variables because if we just split the children into two arrays, consumers
    // would need to remember to supply a key prop for each button, which is easy to forget, and would result in
    // warnings from React.
    if (childCount === 0) {
        return null;
    } else if (childCount === 1) {
        submit = children;
    } else if (childCount === 2) {
        cancel = children[0];
        submit = children[1];
    } else if (childCount === 3) {
        cancel = children[0];
        secondary = children[1];
        submit = children[2];
    } else if (childCount === 4) {
        cancel = children[0];
        secondary = children[1];
        tertiary = children[2];
        submit = children[3];
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
