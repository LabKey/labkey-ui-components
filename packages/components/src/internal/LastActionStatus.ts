/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
