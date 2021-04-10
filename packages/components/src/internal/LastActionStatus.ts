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
    declare type: string;
    declare date: Date;
    declare level: MessageLevel;
    declare message: string;
}
