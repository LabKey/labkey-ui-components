import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { HelpTopicURL } from './HelpTopicURL';

describe('<HelpTopicURL/>', () => {
    test('default properties', () => {
        const component = <HelpTopicURL helpTopic="testTopic" />;

        const { container } = renderWithAppContext(component);
        expect(container).toMatchSnapshot();
    });

    test('with nounPlural', () => {
        const component = <HelpTopicURL helpTopic="sampleTopic" nounPlural="samples" />;

        const { container } = renderWithAppContext(component);
        expect(container).toMatchSnapshot();
    });
});
