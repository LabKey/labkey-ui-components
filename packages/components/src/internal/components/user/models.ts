/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Record } from 'immutable';

export class ChangePasswordModel extends Record({
    userId: undefined,
    oldPassword: '',
    password: '',
    password2: '',
}) {
    declare userId: number;
    declare oldPassword: string;
    declare password: string;
    declare password2: string;
}
