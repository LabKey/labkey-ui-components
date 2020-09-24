import React from 'react';
import renderer from 'react-test-renderer';

import { DomainFieldLabel } from './DomainFieldLabel';

describe('<DomainFieldLabel/>', () => {
    test('label only', () => {
        const component = <DomainFieldLabel label="Field Label" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('label and required', () => {
        const component = <DomainFieldLabel label="Field Label" required={true} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('label and helpTip', () => {
        const component = <DomainFieldLabel label="Field Label" helpTipBody={() => 'Help tip body'} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('label, required, and helpTip', () => {
        const component = <DomainFieldLabel label="Field Label" required={true} helpTipBody={() => 'Help tip body'} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
