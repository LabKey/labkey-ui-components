/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { TEST_USER_GUEST, TEST_USER_READER } from '../userFixtures';

import { AppModel } from './models';

describe('AppModel', () => {
    test('hasUserChanged', () => {
        let model = new AppModel({ initialUserId: 1, user: TEST_USER_GUEST });
        expect(model.hasUserChanged()).toBeTruthy();
        model = new AppModel({ initialUserId: 1, user: TEST_USER_READER });
        expect(model.hasUserChanged()).toBeTruthy();
        model = new AppModel({ initialUserId: TEST_USER_READER.id, user: TEST_USER_READER });
        expect(model.hasUserChanged()).toBeFalsy();
    });

    test('shouldReload', () => {
        let model = new AppModel({ reloadRequired: false, initialUserId: 1, user: TEST_USER_READER });
        expect(model.shouldReload()).toBeTruthy();
        model = new AppModel({ reloadRequired: false, initialUserId: TEST_USER_READER.id, user: TEST_USER_READER });
        expect(model.shouldReload()).toBeFalsy();
        model = new AppModel({ reloadRequired: true, initialUserId: TEST_USER_READER.id, user: TEST_USER_READER });
        expect(model.shouldReload()).toBeTruthy();
    });
});
