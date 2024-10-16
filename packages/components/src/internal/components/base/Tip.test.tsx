import React from 'react';

import { render } from '@testing-library/react';

import { Tip } from './Tip';

describe('<Tip />', () => {
    test('Render children', () => {
        render(
            <Tip caption="nothing important">
                <div>Here's my tip for you</div>
            </Tip>
        );
        expect(document.querySelector('div').textContent).toBe("Here's my tip for you");
    });
});
