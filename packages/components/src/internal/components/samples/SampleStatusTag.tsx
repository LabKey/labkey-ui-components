import React, { FC, memo } from 'react';
import classNames from 'classnames';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { SampleStateTypes } from './constants';
import { isSampleStatusEnabled } from '../../app/utils';
import { SampleStatus } from './models';

interface Props {
    status: SampleStatus,
    iconOnly?: boolean,
    className?: string,
}

export const SampleStatusTag: FC<Props> = memo((props) => {
    const { status, iconOnly, className } = props;
    const { label, statusType, description } = status;

    if (!label || !isSampleStatusEnabled())
        return null;

    const icon = iconOnly ? (
        <i className={classNames("sample-status-icon fa fa-info", {
            "alert-danger":  statusType === SampleStateTypes.Locked,
            "alert-warning": statusType === SampleStateTypes.Consumed,
            "alert-success": statusType === SampleStateTypes.Available,
        })}/>
    ) : <span>{label}</span>;
    const isAvailable = statusType === SampleStateTypes.Available;

    return (
        <>
            <span className={classNames( className, {
                "sample-status-tag": !iconOnly,
                "alert-danger": !iconOnly && statusType === SampleStateTypes.Locked,
                "alert-warning": !iconOnly && statusType === SampleStateTypes.Consumed,
                "alert-success": !iconOnly && statusType === SampleStateTypes.Available,
            })}>
                {(description || !isAvailable) ? (
                    <LabelHelpTip iconComponent={icon} placement="bottom" title={"Sample Status"}>
                        <div className="ws-pre-wrap popover-message">
                            <b>{label}</b> {description && '- '}{description}
                            {!isAvailable && (
                                <div className="margin-top sample-status-warning">
                                    Not all operations are permitted for a sample with this status.
                                </div>
                            )}
                        </div>
                    </LabelHelpTip>
                ) : label}
            </span>
        </>
    );
});
