/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import * as React from "react";
import {shallow} from "enzyme";

import {DomainFieldsDisplay} from "./DomainFieldsDisplay";
import {DomainDesign} from "../models";

describe('DomainFieldsDisplay', () => {

    test('handles empty domain design', () => {
        const component = shallow(<DomainFieldsDisplay domain={new DomainDesign()}/>);

        expect(component.exists()).toBe(true);
    });
});