import * as React from 'react'
import {createNotification, NotificationCreatable} from './actions';
import { getActionErrorMessage } from '../../util/messaging';
import {NotificationItemModel} from "./model";
import {addNotification} from "./global";

export function createDeleteSuccessNotification(noun: string, count?: number, additionalInfo?: string, notify?: (item: NotificationItemModel) => void ) {
    const countStr = count === undefined ? '' : count;
    createNotification('Successfully deleted ' + countStr + ' ' + noun + '. ' + (additionalInfo || ''), notify);
}

export function createDeleteErrorNotification(noun: string, notify?: (item: NotificationItemModel) => void)
{
    createNotification({
        alertClass: 'danger',
        message: () => {
            return getActionErrorMessage( "There was a problem deleting the " + noun + ". ", noun)
        }
    }, notify);
}
