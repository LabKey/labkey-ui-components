import React from 'react';
import { render } from '@testing-library/react';

import { DomainFieldLabel } from './DomainFieldLabel';

describe('<DomainFieldLabel/>', () => {
    test('label only', () => {
        const component = <DomainFieldLabel label="Field Label" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('label and required', () => {
        const component = <DomainFieldLabel label="Field Label" required={true} />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('label and helpTip', () => {
        const component = <DomainFieldLabel label="Field Label" helpTipBody="Help tip body" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('label, required, and helpTip', () => {
        const component = <DomainFieldLabel label="Field Label" required={true} helpTipBody="Help tip body" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
