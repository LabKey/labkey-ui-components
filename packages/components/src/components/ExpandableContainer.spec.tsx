import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { ExpandableContainer } from './ExpandableContainer';

describe('<ExpandableContainer/>', () => {
    test('default props', () => {
        const component = (
            <ExpandableContainer clause={<div>Clause</div>} links={<div>links</div>} isExpandable={true} iconSrc="test">
                <div>Body</div>
            </ExpandableContainer>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <ExpandableContainer
                clause={<div>Clause</div>}
                links={<div>links</div>}
                isExpandable={false}
                initExpanded={true}
                iconFaCls="fa-test"
            >
                <div>Body</div>
            </ExpandableContainer>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with state', () => {
        const wrapper = mount(
            <ExpandableContainer clause={<div>Clause</div>} links={<div>links</div>} isExpandable={true}>
                <div className="expanded-body-cls">Body</div>
            </ExpandableContainer>
        );

        // test the isHover state, should change some css classes
        expect(wrapper.find('.container-expandable-detail__active')).toHaveLength(0);
        expect(wrapper.find('.container-expandable-detail__inactive')).toHaveLength(1);
        wrapper.setState({ isHover: true });
        expect(wrapper.find('.container-expandable-detail__active')).toHaveLength(1);
        expect(wrapper.find('.container-expandable-detail__inactive')).toHaveLength(0);
        wrapper.setState({ isHover: false });

        // test the expanded/visible state, should show body div
        expect(wrapper.find('.expanded-body-cls')).toHaveLength(0);
        expect(wrapper.find('.container-expandable-child__inactive')).toHaveLength(0);
        wrapper.setState({ visible: true });
        expect(wrapper.find('.expanded-body-cls')).toHaveLength(1);
        expect(wrapper.find('.container-expandable-child__inactive')).toHaveLength(1);

        wrapper.unmount();
    });
});
