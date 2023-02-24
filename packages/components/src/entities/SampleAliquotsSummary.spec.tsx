import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { LoadingState } from '../public/LoadingState';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { QueryModel } from '../public/QueryModel/QueryModel';

import { SampleAliquotsSummaryWithModels, SampleAliquotsSummaryWithModelsProps } from './SampleAliquotsSummary';

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
        wrapper: ShallowWrapper,
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
        expect(stats).toHaveLength(5);
        expect(stats.at(0).text()).toBe(totalAliquots + '');
        expect(stats.at(1).text()).toBe(availableCount + '/' + totalAliquots);
        expect(stats.at(2).text()).toBe(totalVolume);
        expect(stats.at(3).text()).toBe(jobsWithAliquots + '');
    }

    test('no aliquots present', () => {
        const wrapper = shallow(<SampleAliquotsSummaryWithModels {...defaultProps()} sampleRow={noAliquotVolume} />);

        validateStats(wrapper, false, true);
        wrapper.unmount();
    });

    test('has single aliquot, not in storage, not added to job', () => {
        const wrapper = shallow(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={zeroAliquotVolume}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StorageStatus: { value: 'Not in storage' },
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                })}
            />
        );

        validateStats(wrapper, false, false, 1, 0, '0', 0);
        wrapper.unmount();
    });

    test('has single aliquot, in storage, no volume, added to job', () => {
        const wrapper = shallow(
            <SampleAliquotsSummaryWithModels
                {...defaultProps()}
                sampleRow={zeroAliquotVolume}
                aliquotsModel={getQueryModelFromRows({
                    1: {
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />
        );

        validateStats(wrapper, false, false, 1, 1, '0', 1);
        wrapper.unmount();
    });

    test('has single aliquot, in storage, without amount, but with unit', () => {
        const wrapper = shallow(
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
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: null },
                        Units: { value: 'g' },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />
        );

        validateStats(wrapper, false, false, 1, 1, '0 g', 1);
        wrapper.unmount();
    });

    test('has single aliquot, in storage, with amount, but without unit', () => {
        const wrapper = shallow(
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
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '100.1' },
                        Units: { value: null },
                    },
                })}
                jobsModel={getQueryModelFromRows({ 1: { RowId: { value: 1 } } })}
            />
        );

        validateStats(wrapper, false, false, 1, 1, '100.1', 1);
        wrapper.unmount();
    });

    test('has multiple aliquots, some storage, without unit, some has jobs', () => {
        const wrapper = shallow(
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
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '100.1' },
                        Units: { value: null },
                    },
                    2: {
                        StorageStatus: { value: 'Not in storage' },
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StorageStatus: { value: 'In storage' },
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
            />
        );

        validateStats(wrapper, false, false, 3, 2, '150.6', 2);
        wrapper.unmount();
    });

    test('has multiple aliquots, some storage, with same unit', () => {
        const wrapper = shallow(
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
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '100.1' },
                        Units: { value: 'mL' },
                    },
                    2: {
                        StorageStatus: { value: 'Not in storage' },
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '50.5' },
                        Units: { value: 'mL' },
                    },
                })}
            />
        );

        validateStats(wrapper, false, false, 3, 2, '150.6 mL', 0);
        wrapper.unmount();
    });

    test('has multiple aliquots, some storage, with different unit', () => {
        const wrapper = shallow(
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
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '100.1' },
                        Units: { value: 'mL' },
                    },
                    2: {
                        StorageStatus: { value: 'Not in storage' },
                        StoredAmount: { value: null },
                        Units: { value: null },
                    },
                    3: {
                        StorageStatus: { value: 'In storage' },
                        StoredAmount: { value: '50.5' },
                        Units: { value: 'L' },
                    },
                })}
            />
        );

        validateStats(wrapper, false, false, 3, 2, '50,600.1 mL', 0);
        wrapper.unmount();
    });

    test('has multiple aliquots, all in storage, but some are checked out', () => {
        const wrapper = shallow(
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
            />
        );

        validateStats(wrapper, false, false, 3, 2, '1,100.1 mL', 2);
        wrapper.unmount();
    });
});
