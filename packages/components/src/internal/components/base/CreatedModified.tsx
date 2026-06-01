/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { caseInsensitive } from '../../util/utils';

import { fromDate, fromNow, parseDate } from '../../util/Date';

import { useAppContext } from '../../AppContext';

import { LoadingSpinner } from './LoadingSpinner';

interface CreatedModifiedProps {
    className?: string;
    row: Record<string, any>;
    useServerDate?: boolean;
}

export const CreatedModified: FC<CreatedModifiedProps> = memo(props => {
    const { className = 'cbmb-inline', row, useServerDate = true } = props;
    const [loading, setLoading] = useState(useServerDate);
    const [serverDate, setServerDate] = useState<Date>();
    const { api } = useAppContext();

    useEffect(() => {
        if (!useServerDate) return;

        (async () => {
            try {
                const serverDate_ = await api.query.getServerDate();
                setServerDate(serverDate_);
            } catch (e) {
                // Do nothing
            } finally {
                setLoading(false);
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const config = useMemo(() => {
        const createdTS = caseInsensitive(row, 'created')?.value;
        const modifiedTS = caseInsensitive(row, 'modified')?.value;
        const hasCreated = createdTS !== undefined;
        const hasModified = modifiedTS !== undefined;
        const useCreated = !hasModified || createdTS === modifiedTS;

        let displayTxt: string;
        const timestamp = useCreated ? createdTS : modifiedTS;
        if (!loading && timestamp) {
            const parsedDate = parseDate(timestamp);
            if (parsedDate) {
                displayTxt = serverDate ? fromDate(parsedDate, serverDate) : fromNow(parsedDate);
            }
        }

        return {
            createdBy: caseInsensitive(row, 'createdBy')?.displayValue,
            createdTS: hasCreated ? createdTS : undefined,
            display: hasCreated || hasModified,
            displayTxt,
            hasCreated,
            hasModified,
            modifiedBy: caseInsensitive(row, 'modifiedBy')?.displayValue,
            modifiedTS: hasModified ? modifiedTS : undefined,
            useCreated,
        };
    }, [loading, row, serverDate]);

    const title = useMemo(() => {
        const title_: string[] = [];

        if (config.display) {
            if (config.hasCreated) {
                title_.push('Created: ' + config.createdTS);

                if (config.createdBy) {
                    title_.push('Created by: ' + config.createdBy);
                }
            }

            if (!config.useCreated && config.hasModified) {
                title_.push('Modified: ' + config.modifiedTS);

                if (config.modifiedBy) {
                    title_.push('Modified by: ' + config.modifiedBy);
                }
            }
        }

        return title_.length > 0 ? title_.join('\n') : '';
    }, [config]);

    if (loading) {
        return <LoadingSpinner />;
    } else if (!config.display) {
        return null;
    }

    return (
        <span className={classNames('createdmodified', 'gray-text', className)} title={title}>
            {config.useCreated ? 'Created' : 'Modified'} {config.displayTxt}
        </span>
    );
});
CreatedModified.displayName = 'CreatedModified';
