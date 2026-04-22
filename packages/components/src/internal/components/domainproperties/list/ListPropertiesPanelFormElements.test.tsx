import React from 'react';

import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';
import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';

import { AllowableActions, BasicPropertiesFields } from './ListPropertiesPanelFormElements';
import { ListModel } from './models';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('BasicPropertiesFields', () => {
    test('new list, default properties', () => {
        const { asFragment } = renderWithAppContext(
            <BasicPropertiesFields model={emptyNewModel} onInputChange={jest.fn()} />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('existing list, existing properties', () => {
        const { asFragment } = renderWithAppContext(
            <BasicPropertiesFields model={populatedExistingModel} onInputChange={jest.fn()} />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('visible basic properties', () => {
        renderWithAppContext(<BasicPropertiesFields model={populatedExistingModel} onInputChange={jest.fn()} />);
        expect(document.querySelectorAll('.domain-field-section-heading')).toHaveLength(1);
        expect(document.querySelectorAll('#name')).toHaveLength(1);
        expect(document.querySelectorAll('#description')).toHaveLength(1);
    });
});

describe('AllowableActions', () => {
    test('new list, default properties', () => {
        const { asFragment } = renderWithAppContext(
            <AllowableActions model={emptyNewModel} onCheckBoxChange={jest.fn()} />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('existing list, existing properties', () => {
        const { asFragment } = renderWithAppContext(
            <AllowableActions model={populatedExistingModel} onCheckBoxChange={jest.fn()} />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('visible AllowableActions', () => {
        renderWithAppContext(<AllowableActions model={populatedExistingModel} onCheckBoxChange={jest.fn()} />);
        expect(document.querySelectorAll('.list__properties__checkbox-row')).toHaveLength(3);
    });
});
