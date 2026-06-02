/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AppURL } from '../../url/AppURL';

import { BreadcrumbCreate } from './BreadcrumbCreate';

const createdModifiedRow = {
    Created: {
        formattedValue: '2019-05-15 19:45',
        value: '2019-05-15 19:45:40.593',
    },
    CreatedBy: {
        displayValue: 'username',
        url: '#/q/core/siteusers/1001',
        value: 1001,
    },
    Modified: {
        formattedValue: '2019-05-16 19:45',
        value: '2019-05-16 19:45:40.593',
    },
    ModifiedBy: {
        displayValue: 'username2',
        url: '#/q/core/siteusers/1002',
        value: 1002,
    },
};

describe('BreadcrumbCreate', () => {
    test('with created row', () => {
        const component = (
            <BreadcrumbCreate row={createdModifiedRow} useServerDate={false}>
                <a href={AppURL.create('q').toString()}>First</a>
            </BreadcrumbCreate>
        );

        renderWithAppContext(component);
        expect(document.querySelectorAll('li')).toHaveLength(1);

        const cbmbElement = document.querySelector('span');
        expect(cbmbElement.textContent).toContain('Modified ');

        const title = cbmbElement.getAttribute('title');
        expect(title).toContain('Created by: username');
        expect(title).toContain('Modified by: username2');
    });

    test('with multiple links, no created row', () => {
        renderWithAppContext(
            <BreadcrumbCreate useServerDate={false}>
                <a href={AppURL.create('q').toString()}>First</a>
                <a href={AppURL.create('q', 'two').toString()}>Second</a>
                <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>
            </BreadcrumbCreate>
        );

        expect(document.querySelectorAll('a')).toHaveLength(3);
    });
});
