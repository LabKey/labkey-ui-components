import React, { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { FormsyInput } from '../forms/input/FormsyReactComponents';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { stringToHtmlId } from '../../util/utils';

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
    toolTip?: string;
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
                <FormsyInput
                    id={stringToHtmlId(inputFieldName)}
                    name={inputFieldName}
                    type="hidden"
                    value={active === first ? 'true' : 'false'}
                />
            )}
            <div
                className={classNames('toggle', 'btn-group', {
                    'toggle-on': firstActive,
                    'toggle-off': secondActive,
                    [className]: !!className,
                })}
                id={id}
            >
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
ToggleButtons.displayName = 'ToggleButtons';

export const ToggleIcon: FC<Props> = memo(props => {
    const {
        first = 'on',
        second = 'off',
        onClick,
        active = 'off',
        className,
        inputFieldName,
        id,
        disabled = false,
        toolTip,
    } = props;
    const firstActive = active === first;
    const secondActive = active === second;

    const firstBtnClick = useCallback(() => {
        if (secondActive && !disabled) onClick(first);
    }, [first, secondActive, onClick, disabled]);

    const secondBtnClick = useCallback(() => {
        if (firstActive && !disabled) onClick(second);
    }, [second, firstActive, onClick, disabled]);

    const body = (
        <>
            {firstActive && <button className="clickable-text fa fa-toggle-on" onClick={secondBtnClick} type="button" />}
            {secondActive && <button className="clickable-text fa fa-toggle-off" onClick={firstBtnClick} type="button" />}
        </>
    );

    return (
        <>
            {inputFieldName && (
                <FormsyInput
                    id={stringToHtmlId(inputFieldName)}
                    name={inputFieldName}
                    type="hidden"
                    value={active === first ? 'true' : 'false'}
                />
            )}
            <div
                className={classNames('toggle', 'toggle-group-icon', 'btn-group', {
                    'toggle-on': firstActive,
                    'toggle-off': secondActive,
                    disabled,
                    [className]: !!className,
                })}
                id={id}
            >
                {toolTip && <LabelHelpTip iconComponent={body}>{toolTip}</LabelHelpTip>}
                {!toolTip && body}
            </div>
        </>
    );
});
ToggleIcon.displayName = 'ToggleIcon';
