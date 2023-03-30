import React from 'react';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { LoadingState } from '../public/LoadingState';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { QueryModel } from '../public/QueryModel/QueryModel';

import { mountWithServerContext } from '../internal/testHelpers';
import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../internal/productFixtures';

import { SampleAliquotsSummaryWithModels, SampleAliquotsSummaryWithModelsProps } from './SampleAliquotsSummary';
import { SampleAliquotAssaysCount } from './SampleAliquotAssaysCount';

const noAliquotVolume = {
    AliquotVolume: {
        value: null,
    },
    Units: {
        displayValue: null,
    },
};

const zeroAliquotVolume = {
    AliquotVolume: {
        value: 0,
    },
    Units: {
        displayValue: null,
    },
};

function getQueryModelFromRows(rows = {}): QueryModel {
    return makeTestQueryModel(
        new SchemaQuery('schema', 'query'),
        undefined,
        rows,
        Object.keys(rows),
        Object.keys(rows).length,
        'id'
    ).mutate({ rowsLoadingState: LoadingState.LOADED });
}

describe('SampleAliquotsSummaryWithModels', () => {
    function defaultProps(): SampleAliquotsSummaryWithModelsProps {
        return {
            aliquotsModel: getQueryModelFromRows(),
            jobsModel: getQueryModelFromRows(),
            sampleId: '86873',
            sampleLsid: 'S-20200404-1',
            sampleRow: noAliquotVolume,
            sampleSet: 'dirt',
        };
    }

    function validateStats(
        wrapper: ReactWrapper,
        loading = false,
        empty?: boolean,
        totalAliquots?: number,
        availableCount?: number,
        totalVolume?: string,
        jobsWithAliquots?: number
    ): void {
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);
        if (loading) return;

        expect(wrapper.find('.sample-aliquots-stats-empty')).toHaveLength(empty ? 1 : 0);
        if (empty) return;

        const stats = wrapper.find('.aliquot-stats-value');
        expect(stats).toHaveLength(4);
        expect(stats.at(0).text()).toBe(totalAliquots + '');
        expect(stats.at(1).text()).toBe(availableCount + '/' + totalAliquots);
        expect(stats.at(2).text()).toBe(totalVolume);
        expect(stats.at(3).text()).toBe(jobsWithAliquots + '');
    }

    test('no aliquots present', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels {...defaultProps()} sampleRow={noAliquotVolume} />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, true);
        wrapper.unmount();
    });

    test('has single aliquot, no stored amount, not added to job', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={zeroAliquotVolume}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: null },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 1, 0, '0', 0);
        wrapper.unmount();
    });

    test('has single aliquot, 0 stored amount, added to job', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={zeroAliquotVolume}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: 0 },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 1, 0, '0', 1);
        wrapper.unmount();
    });

    test('has single aliquot, 0 stored amount, but with unit', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 0,
                    },
                    Units: {
                        displayValue: 'g',
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: null },
                        Units: { value: 'g' },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 1, 0, '0 g', 1);
        wrapper.unmount();
    });

    test('has single aliquot, with amount, but without unit', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 100.1,
                    },
                    Units: {
                        displayValue: null,
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: '100.1' },
                        Units: { value: null },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 1, 1, '100.1', 1);
        wrapper.unmount();
    });

    test('has multiple aliquots, some with amount, without unit, some has jobs', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 150.6,
                    },
                    Units: {
                        displayValue: null,
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: '100.1' },
                        Units: { value: null },
                    },
                    2: {
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StoredAmount: { value: '50.5' },
                        Units: { value: null },
                    },
                })}
                jobsModel={getQueryModelFromRows({
                    1: {
                        RowId: { value: 1 },
                    },
                    3: {
                        RowId: { value: 3 },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 3, 2, '150.6', 2);
        wrapper.unmount();
    });

    test('has multiple aliquots, some with amount, with same unit', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 150.6,
                    },
                    Units: {
                        displayValue: 'mL',
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: '100.1' },
                        Units: { value: 'mL' },
                    },
                    2: {
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StoredAmount: { value: '50.5' },
                        Units: { value: 'mL' },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 3, 2, '150.6 mL', 0);
        wrapper.unmount();
    });

    test('has multiple aliquots, some with amount, with different unit', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 50600.1,
                    },
                    Units: {
                        displayValue: 'mL',
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: '100.1' },
                        Units: { value: 'mL' },
                    },
                    2: {
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StoredAmount: { value: '50.5' },
                        Units: { value: 'L' },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 3, 2, '50,600.1 mL', 0);
        wrapper.unmount();
    });

    test('has multiple aliquots, all with amount, but some are checked out', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={{
                    AliquotVolume: {
                        value: 1100.1,
                    },
                    Units: {
                        displayValue: 'mL',
                    },
                }}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '100.1' },
                        Units: { value: 'mL' },
                    },
                    2: {
                        StorageStatus: { value: 'Checked out' },
                        StoredAmount: { value: '1' },
                        Units: { value: 'L' },
                    },
                    3: {
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: null },
                        Units: { value: 'L' },
                    },
                })}
                jobsModel={getQueryModelFromRows({
                    1: {
                        RowId: { value: 1 },
                    },
                    3: {
                        RowId: { value: 3 },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT }
        );

        validateStats(wrapper, false, false, 3, 2, '1,100.1 mL', 2);
        wrapper.unmount();
    });

    test('LKSM professional should show assay count', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={zeroAliquotVolume}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                })}
            />,
            { moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT }
        );

        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        expect(wrapper.find('.sample-aliquots-stats-empty')).toHaveLength(0);
        expect(wrapper.find('.sample-aliquots-stats-table')).toHaveLength(1);
        expect(wrapper.find(SampleAliquotAssaysCount)).toHaveLength(1);

        const tableRows = wrapper.find('.sample-aliquots-stats-table tr');
        expect(tableRows).toHaveLength(5);
        expect(tableRows.at(4).text()).toBe('Assay Data with Aliquots ');

        expect(wrapper.find('.aliquot-stats-value a').last().prop('href')).toBe(
            '#/samples/dirt/86873/Assays?sampleAliquotType=aliquots'
        );

        wrapper.unmount();
    });
});
