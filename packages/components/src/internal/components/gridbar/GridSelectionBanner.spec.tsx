import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { Button } from 'react-bootstrap';

import { QueryGridModel } from '../../..';

import { GridSelectionBanner } from './GridSelectionBanner';

describe('<GridSelectionBanner/>', () => {
    test('model not loaded', () => {
        const model = new QueryGridModel({
            isLoaded: false,
            isLoading: true,
            selectedLoaded: false,
            maxRows: undefined,
            totalRows: undefined,
        });
        const component = <GridSelectionBanner model={model} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

    test('selection not loaded', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: false,
            maxRows: 10,
            totalRows: 25,
        });
        const component = <GridSelectionBanner model={model} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

    test('none selected, single page', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: true,
            selectedQuantity: 0,
            maxRows: 10,
            totalRows: 5,
        });
        const component = <GridSelectionBanner model={model} />;
        const wrapper = mount(component);
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(0);
        const selectedText = wrapper.find('.QueryGrid-right-spacing');
        expect(selectedText).toHaveLength(0);
    });

    test('none selected, multiple pages', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: true,
            selectedQuantity: 0,
            maxRows: 5,
            totalRows: 15,
        });
        const component = <GridSelectionBanner model={model} />;
        const wrapper = mount(component);
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(1);
        expect(wrapper.text().trim()).toBe('Select all 15');
    });

    test('all selected, single page', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: true,
            selectedQuantity: 3,
            maxRows: 5,
            totalRows: 3,
        });
        const component = <GridSelectionBanner model={model} />;
        const wrapper = mount(component);
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(1);
        const text = wrapper.text().trim();
        expect(text.indexOf('3 of 3 selected')).toBeGreaterThanOrEqual(0);
        expect(text.indexOf('Clear all 3')).toBeGreaterThanOrEqual(0);
    });

    test('all selected, multiple pages', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: true,
            selectedQuantity: 12,
            maxRows: 5,
            totalRows: 12,
        });
        const component = <GridSelectionBanner model={model} />;
        const wrapper = mount(component);
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(1);
        const text = wrapper.text().trim();
        expect(text.indexOf('12 of 12 selected')).toBeGreaterThanOrEqual(0);
        expect(text.indexOf('Clear all 12')).toBeGreaterThanOrEqual(0);
    });

    test('some selected across multiple pages', () => {
        const model = new QueryGridModel({
            isLoaded: true,
            isLoading: false,
            selectedLoaded: true,
            selectedQuantity: 8,
            maxRows: 5,
            totalRows: 12,
        });
        const component = <GridSelectionBanner model={model} />;
        const wrapper = mount(component);
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(2);
        const text = wrapper.text().trim();
        expect(text.indexOf('8 of 12 selected')).toBeGreaterThanOrEqual(0);
        expect(text.indexOf('Clear all 8')).toBeGreaterThanOrEqual(0);
        expect(text.indexOf('Select all 12')).toBeGreaterThanOrEqual(0);
    });
});
