import React from 'react';
import { render } from '@testing-library/react';
import userEvent from "@testing-library/user-event";

import { ExpandableContainer } from './ExpandableContainer';

describe('<ExpandableContainer/>', () => {
    test('default props', () => {
        const component = (
            <ExpandableContainer clause={<div>Clause</div>} links={<div>links</div>} isExpandable={true} iconSrc="test">
                <div>Body</div>
            </ExpandableContainer>
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <ExpandableContainer
                clause={<div>Clause</div>}
                links={<div>links</div>}
                isExpandable={false}
                initExpanded={true}
                iconFaCls="fa-test"
                containerCls="test-container-cls"
            >
                <div>Body</div>
            </ExpandableContainer>
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with state', () => {
        render(
            <ExpandableContainer clause={<div>Clause</div>} links={<div>links</div>} isExpandable={true}>
                <div className="expanded-body-cls">Body</div>
            </ExpandableContainer>
        );

        // test the isHover state, should change some css classes
        expect(document.querySelectorAll('.container-expandable__active')).toHaveLength(0);
        expect(document.querySelectorAll('.container-expandable__inactive')).toHaveLength(1);
        userEvent.hover(document.querySelector('.container-expandable-blue'));
        expect(document.querySelectorAll('.container-expandable__active')).toHaveLength(1);
        expect(document.querySelectorAll('.container-expandable__inactive')).toHaveLength(0);
        userEvent.unhover(document.querySelector('.container-expandable-blue'));

        // test the expanded/visible state, should show body div
        expect(document.querySelectorAll('.expanded-body-cls')).toHaveLength(0);
        expect(document.querySelectorAll('.container-expandable-child__inactive')).toHaveLength(0);
        userEvent.click(document.querySelector('.container-expandable-blue'));
        expect(document.querySelectorAll('.expanded-body-cls')).toHaveLength(1);
        expect(document.querySelectorAll('.container-expandable-child__inactive')).toHaveLength(1);
    });
});
