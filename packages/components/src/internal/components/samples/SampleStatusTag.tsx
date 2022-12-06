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
            className={classNames('sample-status-icon fa fa-info', {
                'alert-danger': statusType === SampleStateType.Locked,
                'alert-warning': statusType === SampleStateType.Consumed,
                'alert-success': statusType === SampleStateType.Available,
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
                    'status-tag sample-status-tag': !iconOnly,
                    'alert-danger': !iconOnly && statusType === SampleStateType.Locked,
                    'alert-warning': !iconOnly && statusType === SampleStateType.Consumed,
                    'alert-success': !iconOnly && statusType === SampleStateType.Available,
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
