import React from 'react';
import { render } from '@testing-library/react';

import { SectionHeading } from './SectionHeading';

describe('<SectionHeading/>', () => {
    test('title only', () => {
        const component = <SectionHeading title="Section Heading Title" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('title and cls', () => {
        const component = <SectionHeading title="Section Heading Title" cls="section-heading-cls" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
