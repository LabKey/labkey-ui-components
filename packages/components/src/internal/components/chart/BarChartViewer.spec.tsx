import React from 'react';
import {Button} from "react-bootstrap";

import { SampleButtons } from './BarChartViewer';
import {mountWithServerContext} from "../../testHelpers";
import {TEST_USER_READER, TEST_USER_AUTHOR} from "../../../test/data/users";

describe('SampleButtons', () => {
    test('with insert and sample finder enabled', () => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-finder': true } };
        const wrapper = mountWithServerContext(<SampleButtons />, { user: TEST_USER_AUTHOR });
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Button).first().text()).toBe('Go to Sample Finder');
        expect(wrapper.find(Button).last().text()).toBe('Create Samples');
        wrapper.unmount();
    });

    test('without insert and sample finder enabled', () => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-finder': true } };
        const wrapper = mountWithServerContext(<SampleButtons />, { user: TEST_USER_READER });
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).first().text()).toBe('Go to Sample Finder');
        wrapper.unmount();
    });

    test('with insert and sample finder not enabled', () => {
        LABKEY.moduleContext = { samplemanagement: {} };
        const wrapper = mountWithServerContext(<SampleButtons />, { user: TEST_USER_AUTHOR });
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).first().text()).toBe('Create Samples');
        wrapper.unmount();
    });

    test('without insert and sample finder not enabled', () => {
        LABKEY.moduleContext = { samplemanagement: {} };
        const wrapper = mountWithServerContext(<SampleButtons />, { user: TEST_USER_READER });
        expect(wrapper.find(Button)).toHaveLength(0);
        wrapper.unmount();
    });
});
