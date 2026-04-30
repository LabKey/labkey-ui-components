import React, { FC, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { createPortal } from 'react-dom';

import { blurActiveElement } from '../../util/utils';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Tooltip } from '../../Tooltip';
import { IconWithSrText } from '../../dropdowns';

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
        disabled: disabled,
    });
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLButtonElement>(
        'pagination-button-overlay',
        true,
        false,
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
            className={clsName}
            disabled={disabled}
            onClick={onClick_}
            onPointerEnter={onMouseEnter}
            onPointerLeave={onMouseLeave}
            ref={targetRef}
            type="button"
        >
            <IconWithSrText iconClass={`fa ${iconClass}`} srText={tooltip} />
            {show && createPortal(tooltip_, portalEl)}
        </button>
    );
};
PaginationButton.displayName = 'PaginationButton';
