import React, { FC, memo } from 'react';
import classNames from 'classnames';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { isSampleStatusEnabled } from '../../app/utils';

import { SampleStateType } from './constants';
import { SampleStatus } from './models';

interface Props {
    className?: string;
    hideDescription?: boolean;
    iconOnly?: boolean;
    status: SampleStatus;
}

export const SampleStatusTag: FC<Props> = memo(props => {
    const { status, iconOnly, className, hideDescription } = props;
    const { label, statusType, description } = status;

    if (!label || !isSampleStatusEnabled()) return null;

    const icon = iconOnly ? (
        <i
            className={classNames('status-icon fa fa-info', {
                danger: statusType === SampleStateType.Locked,
                warning: statusType === SampleStateType.Consumed,
                success: statusType === SampleStateType.Available,
            })}
        />
    ) : (
        <span>{label}</span>
    );
    const isAvailable = statusType === SampleStateType.Available || !statusType;

    return (
        <>
            <span
                className={classNames(className, {
                    'status-pill sample-status-pill': !iconOnly,
                    danger: !iconOnly && statusType === SampleStateType.Locked,
                    warning: !iconOnly && statusType === SampleStateType.Consumed,
                    success: !iconOnly && statusType === SampleStateType.Available,
                })}
            >
                {!hideDescription && (description || !isAvailable || iconOnly) ? (
                    <LabelHelpTip iconComponent={icon} placement="bottom" title="Sample Status">
                        <div className="ws-pre-wrap popover-message">
                            <b>{label}</b> {description && '- '}
                            {description}
                            {!isAvailable && (
                                <div className="margin-top sample-status-warning">
                                    Not all operations are permitted for a sample with this status.
                                </div>
                            )}
                        </div>
                    </LabelHelpTip>
                ) : (
                    label
                )}
            </span>
        </>
    );
});
