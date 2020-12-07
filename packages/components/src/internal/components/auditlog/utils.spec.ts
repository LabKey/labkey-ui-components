/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import { getAuditQueries } from './utils';

describe('utils', () => {
    test('getAuditQueries', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            inventory: {},
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(13);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(5);

        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(12);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(-1);

        LABKEY.moduleContext = {};
        auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(0);
    });
});
