import * as React from 'react'
import renderer from 'react-test-renderer'
import { Map, fromJS } from 'immutable'
import { SearchResultCard } from "./SearchResultCard";
import { mount } from "enzyme";

describe("<SearchResultCard/>", () => {

    test("default props", () => {
        const component = (
            <SearchResultCard title={'Card Title'} summary={'Card Summary'} url={'#card'}/>
        );

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/default.svg');
        expect(wrapper.text().indexOf('Type: ')).toBe(-1);
        wrapper.unmount();

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("resolve image and type from dataClass", () => {
        const data = fromJS({dataClass: {name: 'molecule'}});
        const component = (
            <SearchResultCard title={'Card Title'} summary={'Card Summary'} url={'#card'} data={data}/>
        );

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/molecule.svg');
        expect(wrapper.text().indexOf('Type: molecule')).toBeGreaterThan(-1);
        wrapper.unmount();
    });

    test("resolve image and type from sampleSet", () => {
        const data = fromJS({sampleSet: {name: 'Sample Set 1'}});
        const component = (
            <SearchResultCard title={'Card Title'} summary={'Card Summary'} url={'#card'} data={data}/>
        );

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/samples.svg');
        expect(wrapper.text().indexOf('Type: Sample Set 1')).toBeGreaterThan(-1);
        wrapper.unmount();
    });

    test("with iconUrl", () => {
        const iconUrl = 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png';
        const component = (
            <SearchResultCard title={'Card Title'} summary={'Card Summary'} url={'#card'} iconUrl={iconUrl}/>
        );

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe(iconUrl);
        expect(wrapper.text().indexOf('Type: ')).toBe(-1);
        wrapper.unmount();
    });

});