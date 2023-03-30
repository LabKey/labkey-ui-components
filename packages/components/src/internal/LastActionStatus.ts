export enum MessageLevel {
    info,
    warning,
    error,
}

export class LastActionStatus {
    declare type: string;
    declare date: Date;
    declare level: MessageLevel;
    declare message: string;

    constructor(data: Partial<LastActionStatus>) {
        Object.assign(
            this,
            {
                type: undefined,
                date: undefined,
                level: MessageLevel.info,
                message: undefined,
            },
            data
        );
    }
}
