import React from 'react';
import renderer from 'react-test-renderer';

import { SectionHeading } from './SectionHeading';

describe('<SectionHeading/>', () => {
    test('title only', () => {
        const component = <SectionHeading title="Section Heading Title" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('title and cls', () => {
        const component = <SectionHeading title="Section Heading Title" cls="section-heading-cls" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
