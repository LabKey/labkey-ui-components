/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';
import { AppLink } from '../url/AppLink';
import { AppURL } from '../url/AppURL';
import { caseInsensitive } from '../util/utils';

interface Props {
    row: Map<any, any>;
}

export class TransactionAuditIdRenderer extends PureComponent<Props> {
    render(): ReactNode {
        const { row } = this.props;
        const _row = row.toJS();
        const id = caseInsensitive(_row, 'transactionId')?.value;
        if (!id) {
            return null;
        }
        let url = AppURL.create('audit', id);
        const activeTab = caseInsensitive(_row, 'EventType')?.value;
        if (activeTab) {
            url = url.addParam('tab', activeTab);
        }
        return <AppLink to={url}>{id}</AppLink>;
    }
}
