import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { LabelColorRenderer } from './LabelColorRenderer';

describe('LabelColorRenderer', () => {
    test('undefined data', () => {
        const component = <LabelColorRenderer data={undefined} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('empty data', () => {
        const component = <LabelColorRenderer data={fromJS({})} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with data', () => {
        const component = <LabelColorRenderer data={fromJS({ value: '#000000' })} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
