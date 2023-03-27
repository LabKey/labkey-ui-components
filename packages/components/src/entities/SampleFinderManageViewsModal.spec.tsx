import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { getTestAPIWrapper } from '../internal/APIWrapper';

import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

import { SampleFinderManageViewsModal } from './SampleFinderManageViewsModal';
import { FinderReport } from '../internal/components/search/models';

export const SAVED_VIEW1: FinderReport = {
    reportId: 'db:292',
    reportName: 'Text1',
    entityId: 'bb03caaf-b76e-103a-a843-0cff0bac6533',
    isSession: false,
};

export const SAVED_VIEW2: FinderReport = {
    reportId: 'db:293',
    reportName: 'source2',
    entityId: 'bb03cc46-b76e-103a-a843-0cff0bac6533',
    isSession: false,
};


export const getSampleFinderAPI = (savedViews: FinderReport[]) => {
    return getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            loadFinderSearches: jest.fn().mockResolvedValue(savedViews),
        }),
    });
};

describe('SampleFinderManageViewsModal', () => {
    test('no saved views', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderManageViewsModal onDone={jest.fn()} />, {
            api: getSampleFinderAPI([]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(0);

        wrapper.unmount();
    });

    test('one saved view', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderManageViewsModal onDone={jest.fn()} />, {
            api: getSampleFinderAPI([SAVED_VIEW2]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('ModalTitle').text()).toBe('Manage Saved Searches');

        expect(wrapper.find('.fa-lock').length).toBe(0);
        expect(wrapper.find('.fa-pencil').length).toBe(1);
        expect(wrapper.find('.fa-trash-o').length).toBe(1);

        const findButton = wrapper.find('button.btn-default');
        expect(findButton.text()).toEqual('Done editing');

        wrapper.unmount();
    });

    test('one saved view, locked (currently viewing)', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleFinderManageViewsModal currentView={SAVED_VIEW2} onDone={jest.fn()} />,
            {
                api: getSampleFinderAPI([SAVED_VIEW2]),
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('.fa-lock').length).toBe(1);
        expect(wrapper.find('.fa-pencil').length).toBe(0);
        expect(wrapper.find('.fa-trash-o').length).toBe(0);

        wrapper.unmount();
    });

    test('multiple saved views, with locked view', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleFinderManageViewsModal currentView={SAVED_VIEW2} onDone={jest.fn()} />,
            {
                api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(2);
        expect(rows.at(0).text()).toContain('Text1');
        expect(rows.at(0).find('.fa-lock').length).toBe(0);
        expect(rows.at(0).find('.fa-pencil').length).toBe(1);
        expect(rows.at(0).find('.fa-trash-o').length).toBe(1);
        expect(rows.at(1).text()).toContain('source2');
        expect(rows.at(1).find('.fa-lock').length).toBe(1);
        expect(rows.at(1).find('.fa-pencil').length).toBe(0);
        expect(rows.at(1).find('.fa-trash-o').length).toBe(0);

        const findButton = wrapper.find('button.btn-default');
        expect(findButton.text()).toEqual('Done editing');

        wrapper.unmount();
    });

    test('multiple saved views', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderManageViewsModal onDone={jest.fn()} />, {
            api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(2);
        expect(rows.at(0).text()).toContain('Text1');
        expect(rows.at(0).find('.fa-pencil').length).toBe(1);
        expect(rows.at(0).find('.fa-trash-o').length).toBe(1);
        expect(rows.at(1).text()).toContain('source2');
        expect(rows.at(1).find('.fa-pencil').length).toBe(1);
        expect(rows.at(1).find('.fa-trash-o').length).toBe(1);

        wrapper.unmount();
    });
});
