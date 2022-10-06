import { getSampleWizardURL, filterSampleRowsForOperation, getCrossFolderSelectionMsg, shouldIncludeMenuItem } from './utils';
import {SamplesEditButtonSections} from '../components/samples/utils';
import {SAMPLE_STATE_TYPE_COLUMN_NAME, SampleOperation, SampleStateType} from "../components/samples/constants";

describe('getCrossFolderSelectionMsg', () => {
    test('without cross folder selection', () => {
        expect(getCrossFolderSelectionMsg(0, 0, 'sample', 'samples')).toBeUndefined();
        expect(getCrossFolderSelectionMsg(0, 1, 'sample', 'samples')).toBeUndefined();
    });
    test('with cross folder selection and without current folder selection', () => {
        expect(getCrossFolderSelectionMsg(1, 0, 'sample', 'samples')).toBe(
            'The sample you selected does not belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them.'
        );
        expect(getCrossFolderSelectionMsg(2, 0, 'sample', 'samples')).toBe(
            "The samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
    });
    test('with cross folder selection and with current folder selection', () => {
        expect(getCrossFolderSelectionMsg(1, 1, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 1, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(1, 2, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 2, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 2, 'data', 'data')).toBe(
            "Some of the data you selected don't belong to this project. Please select data from only this project, or navigate to the appropriate project to work with them."
        );
    });
});

describe('shouldIncludeMenuItem', () => {
    test('undefined excludedMenuKeys', () => {
        expect(shouldIncludeMenuItem(undefined, undefined)).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, undefined)).toBeTruthy();
        expect(shouldIncludeMenuItem(undefined, [])).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, [])).toBeTruthy();
    });

    test('with excludedMenuKeys', () => {
        expect(shouldIncludeMenuItem(undefined, [SamplesEditButtonSections.IMPORT])).toBeTruthy();
        expect(
            shouldIncludeMenuItem(SamplesEditButtonSections.DELETE, [SamplesEditButtonSections.IMPORT])
        ).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, [SamplesEditButtonSections.IMPORT])).toBeFalsy();
    });
});

describe('filterSampleRowsForOperation', () => {
    const availableRow1 = {
        rowId: { value: 1 },
        SampleID: { value: 1, displayValue: 'T-1' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const availableRow2 = {
        rowId: { value: 2 },
        sampleId: { value: 2, displayValue: 'T-2' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const consumedRow1 = {
        rowId: { value: 20 },
        SampleID: { value: 20, displayValue: 'T-20' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Consumed },
    };
    const lockedRow1 = {
        rowId: { value: 30 },
        SampleID: { value: 30, displayValue: 'T-30' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };
    const lockedRow2 = {
        rowId: { value: 31 },
        SampleID: { value: 310, displayValue: 'T-310' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };

    function validate(
        rows: { [p: string]: any },
        operation: SampleOperation,
        numAllowed: number,
        numNotAllowed: number
    ): void {
        const filteredData = filterSampleRowsForOperation(rows, operation, 'RowId', {
            api: { moduleNames: ['samplemanagement'] },
        });
        expect(Object.keys(filteredData.rows)).toHaveLength(numAllowed);
        expect(filteredData.statusData.allowed).toHaveLength(numAllowed);
        expect(filteredData.statusData.notAllowed).toHaveLength(numNotAllowed);
        if (numNotAllowed == 0) {
            expect(filteredData.statusMessage).toBeNull();
        } else {
            expect(filteredData.statusMessage).toBeTruthy();
        }
    }

    test('all available', () => {
        const data = {
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 0);
    });

    test('all locked', () => {
        const data = {
            30: lockedRow1,
            31: lockedRow2,
        };
        validate(data, SampleOperation.EditMetadata, 0, 2);
        validate(data, SampleOperation.AddToPicklist, 2, 0);
    });

    test('mixed statuses', () => {
        const data = {
            30: lockedRow1,
            20: consumedRow1,
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.EditLineage, 3, 1);
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 2);
        validate(data, SampleOperation.AddToPicklist, 4, 0);
    });
});

describe('getSampleWizardURL', () => {
    test('default props', () => {
        expect(getSampleWizardURL().toHref()).toBe('#/samples/new');
    });

    test('targetSampleSet', () => {
        expect(getSampleWizardURL('target1').toHref()).toBe('#/samples/new?target=target1');
    });

    test('parent', () => {
        expect(getSampleWizardURL(undefined, 'parent1').toHref()).toBe('#/samples/new?parent=parent1');
    });

    test('targetSampleSet and parent', () => {
        expect(getSampleWizardURL('target1', 'parent1').toHref()).toBe('#/samples/new?target=target1&parent=parent1');
    });

    test('targetSampleSet and parent and selectionKey', () => {
        expect(getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1').toHref()).toBe(
            '#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1'
        );
    });

    test('default props, with productId', () => {
        expect(getSampleWizardURL(null, null, null, 'from', 'to').toString()).toBe('/labkey/to/app.view#/samples/new');
    });

    test('targetSampleSet, with productId', () => {
        expect(getSampleWizardURL('target1', null, null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1'
        );
    });

    test('parent, with productId', () => {
        expect(getSampleWizardURL(undefined, 'parent1', null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?parent=parent1'
        );
    });

    test('targetSampleSet and parent, with productId', () => {
        expect(getSampleWizardURL('target1', 'parent1', null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1&parent=parent1'
        );
    });

    test('targetSampleSet and parent and selectionKey, with productId', () => {
        expect(getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1', 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1'
        );
    });
});
