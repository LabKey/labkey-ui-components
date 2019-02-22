/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import * as React from "react";
import renderer from 'react-test-renderer'

import {DomainFieldsDisplay} from "./DomainFieldsDisplay";
import {DomainDesign} from "../models";

const testDomain = new DomainDesign({name: 'test domain name'});

describe('DomainFieldsDisplay', () => {

    test('with empty domain design', () => {
        const domain = new DomainDesign();
        const tree  = renderer.create(<DomainFieldsDisplay
            domain={domain}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('without title', () => {
        const tree  = renderer.create(<DomainFieldsDisplay
            domain={testDomain}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('with title', () => {
        const tree  = renderer.create(<DomainFieldsDisplay
            domain={testDomain}
            title={'test domain title'}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

});