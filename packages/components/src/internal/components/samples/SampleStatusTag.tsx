import React, { FC, memo } from 'react';
import classNames from 'classnames';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { caseInsensitive } from '../../util/utils';
import {
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME, SampleStateTypes
} from './constants';
import { isSampleStatusEnabled } from '../../app/utils';


function getSampleStatus(row: any) {
    return {
        status: caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME)?.displayValue,
        statusType: caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value,
        description: caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value,
    }
}

export const SampleStatusTag: FC<{ sampleRow: any }> = memo(({sampleRow}) => {
    const { status, statusType, description } = getSampleStatus(sampleRow);

    if (!status || !isSampleStatusEnabled())
        return null;

    const icon = <span>{status}</span>;
    const isAvailable = statusType === SampleStateTypes.Available;

    return (
        <>
            <br/>
            <div className={classNames("pull-right sample-status-tag",  {
                "alert-danger": statusType === SampleStateTypes.Locked,
                "alert-warning": statusType === SampleStateTypes.Consumed,
                "alert-success": statusType === SampleStateTypes.Available,
            })}>
                {(description || !isAvailable) ? (
                    <LabelHelpTip iconComponent={icon} placement="bottom" title={"Sample Status"}>
                        <div className="ws-pre-wrap popover-message">
                            <b>{status}</b> - {description}
                            {!isAvailable && (
                                <div className="margin-top sample-status-warning">
                                    Not all operations are permitted for a sample with this status.
                                </div>
                            )}
                        </div>
                    </LabelHelpTip>
                ) : status}
            </div>
        </>
    );
});
