import { Record } from 'immutable';

export enum MessageLevel {
    info,
    warning,
    error,
}

export class LastActionStatus extends Record({
    type: undefined,
    date: undefined,
    level: MessageLevel.info,
    message: undefined,
}) {
    type: string;
    date: Date;
    level: MessageLevel;
    message: string;
}
