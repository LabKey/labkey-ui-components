import React, { FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';

interface Props {
    defaultBtnLabel: string;
    onClickDefaultBtn: () => any;
    btnGroupClass?: string;
    defaultBtnDisabled?: boolean;
    dropdownBtnDisabled?: boolean;
}

// react-bootstrap's native SplitButton can only disable/enable both main and dropdown buttons at the same time
// SplitButtonGroup allow disable/enable buttons separately
export const SplitButtonGroup: FC<Props> = memo(props => {
    const {
        children,
        defaultBtnLabel,
        btnGroupClass,
        onClickDefaultBtn,
        defaultBtnDisabled = false,
        dropdownBtnDisabled = false,
    } = props;

    let btnClass = 'btn-group split-btn-group';
    if (btnGroupClass) btnClass = btnClass + ' ' + btnGroupClass;

    return (
        <div className={btnClass}>
            <button className="btn btn-success" onClick={onClickDefaultBtn} disabled={defaultBtnDisabled} type="button">
                {defaultBtnLabel}
            </button>
            <DropdownButton bsStyle="success" disabled={dropdownBtnDisabled} id="split-btn-group-dropdown-btn" title="">
                {children}
            </DropdownButton>
        </div>
    );
});

SplitButtonGroup.displayName = 'SplitButtonGroup';
