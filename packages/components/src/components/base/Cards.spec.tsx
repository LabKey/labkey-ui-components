import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { Cards } from './Cards';

describe('<Cards/>', () => {
    test('no cards', () => {
        const component = <Cards cards={[]} />;
        const wrapper = mount(component);
        expect(wrapper.find('Card')).toHaveLength(0);
        wrapper.unmount();
    });

    test('with cards', () => {
        const component = <Cards cards={[{ title: 'card1' }, { title: 'card2' }]} />;
        const wrapper = mount(component);
        expect(wrapper.find('Card')).toHaveLength(2);
        wrapper.unmount();
    });

    test('card onClick handler', () => {
        const onClick1 = jest.fn();
        const onClick2 = jest.fn();
        const component = (
            <Cards
                cards={[
                    { title: 'card1', onClick: onClick1 },
                    { title: 'card2', onClick: onClick2 },
                ]}
            />
        );
        const wrapper = mount(component);
        const card1 = wrapper
            .find('.cards__card-title')
            .findWhere(n => n.text() === 'card1')
            .first();
        const card2 = wrapper
            .find('.cards__card-title')
            .findWhere(n => n.text() === 'card2')
            .first();
        expect(onClick1).toHaveBeenCalledTimes(0);
        expect(onClick2).toHaveBeenCalledTimes(0);
        card1.simulate('click');
        expect(onClick1).toHaveBeenCalledTimes(1);
        expect(onClick2).toHaveBeenCalledTimes(0);
        card2.simulate('click');
        expect(onClick1).toHaveBeenCalledTimes(1);
        expect(onClick2).toHaveBeenCalledTimes(1);
        card2.simulate('click');
        expect(onClick1).toHaveBeenCalledTimes(1);
        expect(onClick2).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    test('snapshot with card prop combinations', () => {
        const component = (
            <Cards
                cards={[
                    { title: 'card1' },
                    { title: 'card2', caption: 'caption' },
                    { title: 'card3', iconSrc: 'iconSrc' },
                    { title: 'card4', iconUrl: 'iconUrl' },
                    { title: 'card5', disabled: true },
                    { title: 'card6', href: 'href' },
                    { title: 'card7', onClick: jest.fn() },
                    {
                        title: 'all',
                        caption: 'caption',
                        iconSrc: 'iconSrc',
                        iconUrl: 'iconUrl',
                        href: 'href',
                        disabled: true,
                        onClick: jest.fn(),
                    },
                ]}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
