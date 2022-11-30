import React from 'react';
import { WithRouterProps } from 'react-router';
import { ReactWrapper } from 'enzyme';

import { SubNav } from '../internal/components/navigation/SubNav';
import { mountWithServerContext } from '../internal/testHelpers';
import { TEST_USER_READER, TEST_USER_STORAGE_EDITOR } from '../internal/userFixtures';

import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../internal/productFixtures';

import { TEST_PROJECT_CONTAINER } from '../test/data/constants';

import { createMockWithRouterProps } from '../internal/mockUtils';

import { SampleIndexNav } from './SampleNav';

describe('SampleIndexNav', () => {
    function defaultProps(): WithRouterProps {
        return {
            ...createMockWithRouterProps(),
            params: { sampleType: 'test', id: '123' },
        };
    }

    function validateTabText(wrapper: ReactWrapper, showLineage = true, showAssay = true, showWorkflow = true): void {
        const subNav = wrapper.find(SubNav);
        const tabs = subNav.prop('tabs').toJS();
        let expectedLength = 3;
        if (showLineage) expectedLength++;
        if (showAssay) expectedLength++;
        if (showWorkflow) expectedLength++;
        expect(tabs).toHaveLength(expectedLength);
        let index = 0;
        expect(tabs[index].text).toBe('Overview');
        index++;
        if (showLineage) {
            expect(tabs[index].text).toBe('Lineage');
            index++;
        }
        expect(tabs[index].text).toBe('Aliquots');
        index++;
        if (showAssay) {
            expect(tabs[index].text).toBe('Assays');
            index++;
        }
        if (showWorkflow) {
            expect(tabs[index].text).toBe('Jobs');
            index++;
        }
        expect(tabs[index].text).toBe('Timeline');
        index++;
    }

    test('reader', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            user: TEST_USER_READER,
        });
        validateTabText(wrapper, true, false, false);
    });

    test('storage editor', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            user: TEST_USER_STORAGE_EDITOR,
        });
        validateTabText(wrapper, false, false, false);
    });

    test('reader, LKS starter', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
            user: TEST_USER_READER,
        });
        validateTabText(wrapper, true, true, false);
    });

    test('reader, LKSM starter', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
            user: TEST_USER_READER,
        });
        validateTabText(wrapper, true, false, false);
    });

    test('reader, LKSM professional', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
            user: TEST_USER_READER,
        });
        validateTabText(wrapper, true, true, true);
    });

    test('LKSM professional, storage editor', () => {
        const wrapper = mountWithServerContext(<SampleIndexNav {...defaultProps()} />, {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
            user: TEST_USER_STORAGE_EDITOR,
        });
        validateTabText(wrapper, false, false, true);
    });
});
