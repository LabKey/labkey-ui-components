import * as React from 'react'
import { createNotification } from './actions';
import { getActionErrorMessage } from '../../util/messaging';
import { NotificationItemProps } from "./model";

export function createDeleteSuccessNotification(noun: string, count?: number, additionalInfo?: string, notify?: (notification: NotificationItemProps) => void ) {
    const countStr = count === undefined ? '' : count;
    createNotification('Successfully deleted ' + countStr + ' ' + noun + '. ' + (additionalInfo || ''), notify);
}

export function createDeleteErrorNotification(noun: string, notify?: (notification: NotificationItemProps) => void)
{
    createNotification({
        alertClass: 'danger',
        message: () => {
            return getActionErrorMessage( "There was a problem deleting the " + noun + ". ", noun)
        }
    }, notify);
}
