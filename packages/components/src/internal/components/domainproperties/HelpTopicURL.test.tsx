import React from 'react';

import { HelpTopicURL } from './HelpTopicURL';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

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
