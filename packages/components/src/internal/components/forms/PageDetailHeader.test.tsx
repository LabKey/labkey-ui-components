/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { PageDetailHeader } from './PageDetailHeader';

describe('<PageDetailHeader/>', () => {
    test('default props', () => {
        const component = <PageDetailHeader title="Title" iconSrc="default" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with additional props', () => {
        const component = (
            <PageDetailHeader
                title="Title"
                subTitle="Subtitle"
                description="Description"
                iconDir="iconDir"
                iconSrc="iconSrc"
                leftColumns={5}
            >
                <div>Something off to the right</div>
            </PageDetailHeader>
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('prefer iconUrl', () => {
        const component = <PageDetailHeader title="Title" iconUrl="iconUrl" iconDir="iconDir" iconSrc="iconSrc" />;

        render(component);
        const srcAttr = document.querySelector('img').getAttribute('src');
        expect(srcAttr).toBe('iconUrl');
    });

    test('without icon', () => {
        const component = <PageDetailHeader title="Title" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
