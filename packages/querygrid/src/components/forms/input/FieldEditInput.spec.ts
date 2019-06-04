/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { cleanProps } from "./FieldEditInput";

describe('clearProps', () => {

    test('Empty values', () => {
        const emptyObj = {};
        expect(cleanProps(undefined)).toBeUndefined();
        expect(cleanProps(emptyObj)).toBe(emptyObj);
    });

    test('Remove values', () => {
        let props = {a: 1, b: 2, c: 3};
        expect(cleanProps(props, 'd', 'e', 'f')).toMatchObject({a: 1, b: 2, c: 3});

        props = {a: 1, b: 2, c: 3};
        expect(cleanProps(props, 'a', 'e', 'f')).toMatchObject({b: 2, c: 3});
    });
});