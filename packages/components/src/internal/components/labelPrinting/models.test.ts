/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { BarTenderConfiguration } from './models';

describe('BarTenderConfiguration', () => {
    test('isConfigured', () => {
        expect(new BarTenderConfiguration().isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: undefined }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: null }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: '' }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: ' test ' }).isConfigured()).toBeTruthy();
    });
});
