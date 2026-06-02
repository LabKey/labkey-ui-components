/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

export enum ChangeType {
    add = 'add',
    remove = 'remove',
    modify = 'modify',
    none = 'none',
}

export interface Change {
    type: ChangeType;
    index?: number;
}
