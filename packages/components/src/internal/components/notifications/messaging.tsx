import React, { ReactNode } from 'react';

import { getActionErrorMessage } from '../../..';

export function getDeleteSuccessNotification(noun: string, count?: number, additionalInfo?: string): string {
    const countStr = count === undefined ? '' : count;
    return 'Successfully deleted ' + countStr + ' ' + noun + '. ' + (additionalInfo || '');
}

export function getDeleteErrorNotification(noun: string): ReactNode {
    return getActionErrorMessage('There was a problem deleting the ' + noun + '. ', noun);
}
