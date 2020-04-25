import * as React from 'react';
import { Button, DropdownButton } from 'react-bootstrap';

interface Props {
    defaultBtnLabel: string;
    onClickDefaultBtn: () => any;
    btnGroupClass?: string;
    defaultBtnDisabled?: boolean;
    dropdownBtnDisabled?: boolean;
}

// react-bootstrap's native SplitButton can only disable/enable both main and dropdown buttons at the same time
// SplitButtonGroup allow disable/enable buttons separately
export class SplitButtonGroup extends React.Component<Props, any> {
    static defaultProps = {
        defaultBtnDisabled: false,
        dropdownBtnDisabled: false,
    };

    render() {
        const {
            children,
            defaultBtnLabel,
            btnGroupClass,
            onClickDefaultBtn,
            defaultBtnDisabled,
            dropdownBtnDisabled,
        } = this.props;

        let btnClass = 'btn-group split-btn-group';
        if (btnGroupClass) btnClass = btnClass + ' ' + btnGroupClass;

        return (
            <div className={btnClass}>
                <Button bsStyle="success" onClick={onClickDefaultBtn} disabled={defaultBtnDisabled}>
                    {defaultBtnLabel}
                </Button>
                <DropdownButton
                    bsStyle="success"
                    disabled={dropdownBtnDisabled}
                    id="split-btn-group-dropdown-btn"
                    title=""
                >
                    {children}
                </DropdownButton>
            </div>
        );
    }
}
