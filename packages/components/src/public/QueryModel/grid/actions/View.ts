/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import { Action } from './Action';

export class ViewAction implements Action {
    static NAME = 'view';
    iconCls = 'table';
    param = ViewAction.NAME;
    keyword = ViewAction.NAME;
}
