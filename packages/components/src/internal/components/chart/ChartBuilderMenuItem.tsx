/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useState } from 'react';

import { RequiresModelAndActions } from '../../../public/QueryModel/QueryModel';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { ChartBuilderModal } from './ChartBuilderModal';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

interface Props extends RequiresModelAndActions {
    disabledMessage: string;
    maxCharts: number;
    selectedReportIds: string[];
}

export const ChartBuilderMenuItem: FC<Props> = memo(props => {
    const { actions, disabledMessage, maxCharts, model, selectedReportIds } = props;
    const [showModal, setShowModal] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();

    const onShowModal = useCallback(() => {
        setShowModal(true);
    }, []);

    const onHideModal = useCallback(
        (successMsg?: string) => {
            setShowModal(false);
            if (successMsg) {
                createNotification({ message: successMsg, alertClass: 'success' });
            }
        },
        [createNotification]
    );
    const disabled = selectedReportIds.length >= maxCharts;

    return (
        <>
            <DisableableMenuItem disabled={disabled} disabledMessage={disabledMessage} onClick={onShowModal}>
                <i className="fa fa-plus-circle" />
                <span className="chart-menu-label">Create Chart</span>
            </DisableableMenuItem>
            {showModal && <ChartBuilderModal actions={actions} model={model} onHide={onHideModal} />}
        </>
    );
});
ChartBuilderMenuItem.displayName = 'ChartBuilderMenuItem';
