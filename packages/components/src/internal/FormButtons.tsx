import classNames from 'classnames';
import React, { Children, FC, memo } from 'react';

interface Props {
    sticky?: boolean;
}

export const FormButtons: FC<Props> = memo(({ children, sticky = true }) => {
    const className = classNames('form-buttons', { 'form-buttons--sticky': sticky });
    let cancel;
    let secondary;
    let submit;
    const childCount = Children.count(children);

    if (childCount === 0) {
        return null;
    } else if (childCount === 1) {
        submit = children[0];
    } else if (childCount === 2) {
        cancel = children[0];
        submit = children[1];
    } else if (childCount === 3) {
        cancel = children[0];
        secondary = children[1];
        submit = children[2];
    } else {
        console.error('Invalid number of children passed to FormButtons, not rendering');
        return null;
    }

    return (
        <div className={className}>
            <div className="form-buttons__left">{cancel}</div>
            <div className="form-buttons__right">
                {secondary}
                {submit}
            </div>
        </div>
    );
});
