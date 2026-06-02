/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { PageHeader } from './PageHeader';

describe('<PageHeader />', () => {
    test('render without properties', () => {
        render(<PageHeader showNotifications={false} />);
        expect(document.querySelector('h2')).not.toBeInTheDocument();
    });

    test('render with icon', () => {
        render(<PageHeader showNotifications={false} iconCls="spinner" />);
        expect(document.querySelectorAll('span.spinner').length).toEqual(1);
        expect(document.querySelector('h2').textContent).toEqual(' ');
    });

    test('render with title no icon', () => {
        render(<PageHeader showNotifications={false} title="Page title" />);
        expect(document.querySelectorAll('.page-header-icon').length).toEqual(0);
        expect(document.querySelector('h2').textContent).toEqual('Page title');
    });

    test('render with icon and title', () => {
        render(<PageHeader showNotifications={false} title="Page title" iconCls="fa fa-star" />);
        expect(document.querySelectorAll('span.fa-star').length).toEqual(1);
        expect(document.querySelector('h2').textContent).toEqual(' Page title');
    });


    test('render with icon and title as primary', () => {
        render(<PageHeader primaryHeader showNotifications={false} title="Page title" iconCls="fa fa-star" />);
        expect(document.querySelectorAll('span.fa-star').length).toEqual(1);
        expect(document.querySelector('h1').textContent).toEqual(' Page title');
    });

    test('render with children', () => {
        render(
            <PageHeader showNotifications={false} title="render with children">
                <div className="child">Header text in the header</div>;
            </PageHeader>
        );
        expect(document.querySelectorAll('div.child').length).toEqual(1);
    });
});
