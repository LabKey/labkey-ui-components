import React from 'react';
import { render } from '@testing-library/react';

import { HelpTopicURL } from './HelpTopicURL';

describe('<HelpTopicURL/>', () => {
    test('default properties', () => {
        const component = <HelpTopicURL helpTopic="testTopic" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with nounPlural', () => {
        const component = <HelpTopicURL helpTopic="sampleTopic" nounPlural="samples" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
