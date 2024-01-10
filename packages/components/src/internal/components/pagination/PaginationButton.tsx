import React, { FC, PureComponent, ReactNode, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { createPortal } from 'react-dom';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../base/Tip';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Tooltip } from '../../Tooltip';

interface Props {
    className?: string;
    disabled: boolean;
    iconClass: string;
    onClick: () => void;
    tooltip: string;
}

export const PaginationButton: FC<Props> = ({ className, disabled, iconClass, onClick, tooltip }) => {
    const clsName = classNames(className, 'pagination-button btn btn-default', {
        'disabled-button-with-tooltip': disabled,
    });
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLButtonElement>(
        'pagination-button-overlay',
        true,
        true,
        200
    );
    const onClick_ = useCallback((): void => {
        onClick();
        blurActiveElement();
    }, [onClick]);
    const tooltip_ = useMemo(
        () => (
            <Tooltip id="pagination-button-tooltip" placement="top" targetRef={targetRef}>
                {tooltip}
            </Tooltip>
        ),
        [targetRef, tooltip]
    );

    return (
        <button
            disabled={disabled}
            className={clsName}
            onClick={onClick_}
            onPointerEnter={onMouseEnter}
            onPointerLeave={onMouseLeave}
            ref={targetRef}
            type="button"
        >
            <i className={`fa ${iconClass}`} />
            {show && createPortal(tooltip_, portalEl)}
        </button>
    );
};
