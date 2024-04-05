import React, { CSSProperties, FC, memo, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Filter } from '@labkey/api';

import { LabelHelpTip } from '../base/LabelHelpTip';
import { isSampleStatusEnabled } from '../../app/utils';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';

import { useAppContext } from '../../AppContext';

import { SampleStatus } from './models';
import { SAMPLE_STATUS_COLORS, SampleStateType } from './constants';
import { getSampleStatusColor } from './utils';

interface Props {
    className?: string;
    hideDescription?: boolean;
    iconOnly?: boolean;
    status: SampleStatus;
}

// exported for Jest test
export function hexToRGB(hex: string): number[] {
    const bigInt = parseInt(hex?.replace('#', ''), 16);
    const r = (bigInt >> 16) & 255;
    const g = (bigInt >> 8) & 255;
    const b = bigInt & 255;
    return [r, g, b];
}

// exported for Jest test
export function getStatusTagStyle(status: SampleStatus): CSSProperties {
    const color = getSampleStatusColor(status.color, status.statusType);
    const style = SAMPLE_STATUS_COLORS[color];
    if (style) {
        return {
            ...style,
            borderColor: 'lightgray',
        };
    }
    const rgb = hexToRGB(status.color);
    const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2])/255;
    return {
        borderColor: 'lightgray',
        backgroundColor: status.color,
        color: luminance <= 0.5 ? 'white' : '#555555',
    };
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
        <i className="status-icon fa fa-info" style={getStatusTagStyle(status)} />
    ) : (
        <span>{label}</span>
    );
    const isAvailable = statusType_ === SampleStateType.Available || !statusType_;

    return (
        <>
            <span
                className={classNames(className, {
                    'status-pill sample-status-pill': !iconOnly,
                })}
                style={getStatusTagStyle(status)}
            >
                {!hideDescription && (description || !isAvailable || iconOnly) ? (
                    <LabelHelpTip iconComponent={icon} placement="right" title="Sample Status">
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
