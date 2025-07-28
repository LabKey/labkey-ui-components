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
