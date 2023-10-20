import React, { FC, memo, useCallback } from 'react';
import { Input } from 'formsy-react-components';

interface Props {
    active: string;
    bsStyleFirstActive?: string;
    bsStyleFirstInactive?: string;
    bsStyleSecondActive?: string;
    bsStyleSecondInactive?: string;
    className?: string;
    disabled?: boolean;
    first?: string;
    id?: string;
    inputFieldName?: string;
    onClick: (selected: string) => void;
    second?: string;
}

export const ToggleButtons: FC<Props> = memo(props => {
    const {
        disabled = false,
        first = 'Enabled',
        second = 'Disabled',
        onClick,
        active,
        className = 'control-toggle-btn-group',
        bsStyleFirstActive = 'primary',
        bsStyleFirstInactive = 'default',
        bsStyleSecondActive = 'primary',
        bsStyleSecondInactive = 'default',
        inputFieldName,
        id,
    } = props;
    const firstActive = active === first;
    const firstCls = 'btn btn-' + (firstActive ? bsStyleFirstActive : bsStyleFirstInactive);
    const secondActive = active === second;
    const secondCls = 'btn btn-' + (secondActive ? bsStyleSecondActive : bsStyleSecondInactive);

    const firstBtnClick = useCallback(() => {
        if (secondActive) onClick(first);
    }, [first, secondActive, onClick]);

    const secondBtnClick = useCallback(() => {
        if (firstActive) onClick(second);
    }, [second, firstActive, onClick]);

    return (
        <>
            {inputFieldName && (
                <Input name={inputFieldName} type="hidden" value={active === first ? 'true' : 'false'} />
            )}
            <div className={'btn-group' + (className ? ' ' + className : '')} id={id}>
                <button type="button" className={firstCls} onClick={firstBtnClick} disabled={disabled}>
                    {first}
                </button>
                <button type="button" className={secondCls} onClick={secondBtnClick} disabled={disabled}>
                    {second}
                </button>
            </div>
        </>
    );
});

export const ToggleIcon: FC<Props> = memo(props => {
    const { first = 'on', second = 'off', onClick, active = 'off', className, inputFieldName, id } = props;
    const firstActive = active === first;
    const secondActive = active === second;

    const firstBtnClick = useCallback(() => {
        if (secondActive) onClick(first);
    }, [first, secondActive, onClick]);

    const secondBtnClick = useCallback(() => {
        if (firstActive) onClick(second);
    }, [second, firstActive, onClick]);

    return (
        <>
            {inputFieldName && (
                <Input name={inputFieldName} type="hidden" value={active === first ? 'true' : 'false'} />
            )}
            <div className={'toggle-group-icon btn-group' + (className ? ' ' + className : '')} id={id}>
                {firstActive && <i className="fa fa-toggle-on" onClick={secondBtnClick} />}
                {secondActive && <i className="fa fa-toggle-off" onClick={firstBtnClick} />}
            </div>
        </>
    );
});
