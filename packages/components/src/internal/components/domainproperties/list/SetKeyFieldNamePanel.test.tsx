import React from 'react';
import { render } from '@testing-library/react';

import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';
import getDomainDetailsWithAutoIncPKJSON from '../../../../test/data/list-getDomainDetails-withAutoIntPK.json';
import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';

import { SetKeyFieldNamePanel } from './SetKeyFieldNamePanel';
import { ListModel } from './models';

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const populatedExitingModelWithAutoIncPK = ListModel.create(getDomainDetailsWithAutoIncPKJSON);

describe('SetKeyFieldNamePanel', () => {
    test('new list, default properties', () => {
        const setKeyFieldNamePanel = (
            <SetKeyFieldNamePanel
                model={emptyNewModel}
                onModelChange={jest.fn()}
                domain={emptyNewModel.domain}
                domainIndex={1}
            />
        );

        const { container } = render(setKeyFieldNamePanel);
        expect(container).toMatchSnapshot();
    });

    test('existing list, given properties', () => {
        const setKeyFieldNamePanel = (
            <SetKeyFieldNamePanel
                model={populatedExistingModel}
                onModelChange={jest.fn()}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        const { container } = render(setKeyFieldNamePanel);
        expect(container).toMatchSnapshot();
    });

    test('list with auto integer key', () => {
        const setKeyFieldNamePanel = (
            <SetKeyFieldNamePanel
                model={populatedExitingModelWithAutoIncPK}
                onModelChange={jest.fn()}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        const { container } = render(setKeyFieldNamePanel);
        expect(container).toMatchSnapshot();
    });

    test('key fields that are unnamed, or are not of string or int dataType, are invalid', () => {
        render(
            <SetKeyFieldNamePanel
                model={populatedExistingModel}
                onModelChange={jest.fn()}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        const selectOptionsText = document.querySelector('.form-control').textContent;
        expect(selectOptionsText).toContain('SubjectID');
        expect(selectOptionsText).toContain('Name');
        expect(selectOptionsText).toContain('Family');
        expect(selectOptionsText).toContain('Species');
        expect(selectOptionsText).toContain('MaritalStatus');
        expect(selectOptionsText).toContain('CurrentStatus');
        expect(selectOptionsText).toContain('Gender');
        expect(selectOptionsText).toContain('Auto integer');

        expect(selectOptionsText).not.toContain('Mothers');
        expect(selectOptionsText).not.toContain('Father');
        expect(selectOptionsText).not.toContain('Image');
        expect(selectOptionsText).not.toContain('Occupation');
        expect(selectOptionsText).not.toContain('BirthDate');
        expect(selectOptionsText).not.toContain('CartoonAvailable');
    });
});
