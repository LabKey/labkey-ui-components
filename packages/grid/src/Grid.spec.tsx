/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { mount, shallow } from 'enzyme'

import { Grid } from './Grid'

describe('Grid component', () => {

    test('handles empty props', () => {
        const component = shallow(<Grid/>);

        expect(component.exists()).toBe(false);
    });
});