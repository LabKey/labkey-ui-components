import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Filter } from '@labkey/api';

import { LabelHelpTip } from '../base/LabelHelpTip';
import { isSampleStatusEnabled } from '../../app/utils';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';

import { useAppContext } from '../../AppContext';

import { SampleStatus } from './models';
import { SampleStateType } from './constants';

interface Props {
    className?: string;
    hideDescription?: boolean;
    iconOnly?: boolean;
    status: SampleStatus;
}

export const SampleStatusTag: FC<Props> = memo(props => {
    const { api } = useAppContext();
    const { moduleContext } = useServerContext();
    const { status, iconOnly, className, hideDescription } = props;
    const { label, statusType, description } = status;
    const [queryStatusType, setQueryStatusType] = useState<SampleStateType>();
    const statusType_ = useMemo(() => statusType || queryStatusType, [statusType, queryStatusType]);

    useEffect(() => {
        (async () => {
            // if the queryModel had the status label value but not the type, query to get it from the SampleStatus table
            if (label && !statusType) {
                try {
                    const response = await api.query.selectRows({
                        columns: ['Label', 'StatusType'],
                        filterArray: [Filter.create('Label', label)],
                        schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_STATUS,
                    });
                    if (response?.rows.length > 0) {
                        const statusTypeStr = caseInsensitive(response.rows[0], 'StatusType')?.value;
                        if (statusTypeStr) setQueryStatusType(SampleStateType[statusTypeStr]);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        })();
    }, [api.query, label, statusType]);

    if (!label || !isSampleStatusEnabled(moduleContext)) return null;

    const icon = iconOnly ? (
        <i
            className={classNames('status-icon fa fa-info', {
                danger: statusType_ === SampleStateType.Locked,
                warning: statusType_ === SampleStateType.Consumed,
                success: statusType_ === SampleStateType.Available,
            })}
        />
    ) : (
        <span>{label}</span>
    );
    const isAvailable = statusType_ === SampleStateType.Available || !statusType_;

    return (
        <>
            <span
                className={classNames(className, {
                    'status-pill sample-status-pill': !iconOnly,
                    danger: !iconOnly && statusType_ === SampleStateType.Locked,
                    warning: !iconOnly && statusType_ === SampleStateType.Consumed,
                    success: !iconOnly && statusType_ === SampleStateType.Available,
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
