import React from 'react';
import renderer from 'react-test-renderer';

import { HelpTopicURL } from './HelpTopicURL';

describe('<HelpTopicURL/>', () => {
    test('default properties', () => {
        const component = <HelpTopicURL helpTopic="testTopic" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with nounPlural', () => {
        const component = <HelpTopicURL helpTopic="sampleTopic" nounPlural="samples" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
