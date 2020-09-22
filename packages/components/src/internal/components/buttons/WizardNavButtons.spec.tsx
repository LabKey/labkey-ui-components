import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { Button } from 'react-bootstrap';

import { WizardNavButtons } from './WizardNavButtons';

describe('<WizardNavButtons/>', () => {
    test('default props', () => {
        const cancelFn = jest.fn();
        const component = <WizardNavButtons cancel={cancelFn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('finish props', () => {
        const cancelFn = jest.fn();
        const component = (
            <WizardNavButtons
                cancel={cancelFn}
                finishText="Custom Finish"
                finishStyle="info"
                finish={true}
                canFinish={false}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with children', () => {
        const cancelFn = jest.fn();
        const component = (
            <WizardNavButtons cancel={cancelFn} includeNext={false}>
                <Button>first</Button>
                <Button>second</Button>
            </WizardNavButtons>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('onClick handlers', () => {
        const cancelFn = jest.fn();
        const prevFn = jest.fn();
        const nextFn = jest.fn();
        const component = <WizardNavButtons cancel={cancelFn} previousStep={prevFn} nextStep={nextFn} />;

        const wrapper = mount(component);
        expect(cancelFn).toHaveBeenCalledTimes(0);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Cancel').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Back').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Next').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
