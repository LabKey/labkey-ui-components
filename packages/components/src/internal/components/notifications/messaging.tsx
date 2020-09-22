import * as React from 'react';

import { getActionErrorMessage } from '../../../util/messaging';

import { createNotification } from './actions';
import { NotificationItemProps } from './model';

export function createDeleteSuccessNotification(
    noun: string,
    count?: number,
    additionalInfo?: string,
) {
    const countStr = count === undefined ? '' : count;
    createNotification('Successfully deleted ' + countStr + ' ' + noun + '. ' + (additionalInfo || ''));
}

export function createDeleteErrorNotification(noun: string) {
    createNotification(
        {
            alertClass: 'danger',
            message: () => {
                return getActionErrorMessage('There was a problem deleting the ' + noun + '. ', noun);
            },
        }
    );
}
