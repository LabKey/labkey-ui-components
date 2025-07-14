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
        const id = caseInsensitive(row.toJS(), 'transactionId')?.value;
        if (!id) {
            return null;
        }
        return <AppLink to={AppURL.create('audit', id)}>{id}</AppLink>;
    }
}
