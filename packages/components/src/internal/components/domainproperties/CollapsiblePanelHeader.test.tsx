import React from 'react';
import { render } from '@testing-library/react';

import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';

describe('<CollapsiblePanelHeader/>', () => {
    test('default properties', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                collapsed={true}
                collapsible={true}
                controlledCollapse={true}
                panelStatus="NONE"
                isValid={true}
                togglePanel={jest.fn()}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('custom properties', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                collapsed={true}
                collapsible={true}
                controlledCollapse={true}
                isValid={true}
                togglePanel={jest.fn()}
                titlePrefix="Test Prefix"
                headerDetails="N Fields"
                panelStatus="COMPLETE"
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('not controlledCollapse', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                isValid
                togglePanel={jest.fn()}
                collapsed={true}
                collapsible={false}
                controlledCollapse={false}
                headerDetails="N Fields"
                panelStatus="COMPLETE"
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('not collapsible', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                panelStatus="NONE"
                isValid
                togglePanel={jest.fn()}
                collapsed={false}
                collapsible={false}
                controlledCollapse={false}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('invalid, iconHelpMsg, and expanded', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                collapsed={false}
                collapsible
                controlledCollapse
                togglePanel={jest.fn()}
                isValid
                panelStatus="INPROGRESS"
                iconHelpMsg="Test icon help message"
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('panelStatus TODO and help tip', () => {
        const component = (
            <CollapsiblePanelHeader
                id="test-id"
                title="Test Title"
                collapsed
                collapsible
                controlledCollapse
                isValid
                togglePanel={jest.fn()}
                panelStatus="TODO"
                todoIconHelpMsg="Some other TODO message goes here."
            >
                <div>Test help tip message</div>
            </CollapsiblePanelHeader>
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
