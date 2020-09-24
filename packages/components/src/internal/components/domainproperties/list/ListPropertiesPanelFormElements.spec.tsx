import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';

import { SectionHeading } from '../SectionHeading';

import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';
import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';

import {
    AllowableActions,
    BasicPropertiesFields,
    CheckBoxRow,
    DescriptionInput,
    NameInput,
} from './ListPropertiesPanelFormElements';
import { ListModel } from './models';

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('BasicPropertiesFields', () => {
    test('new list, default properties', () => {
        const basicPropertiesFields = <BasicPropertiesFields model={emptyNewModel} onInputChange={jest.fn()} />;

        const tree = renderer.create(basicPropertiesFields).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('existing list, existing properties', () => {
        const basicPropertiesFields = (
            <BasicPropertiesFields model={populatedExistingModel} onInputChange={jest.fn()} />
        );

        const tree = renderer.create(basicPropertiesFields).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('visible basic properties', () => {
        const basicPropertiesFields = mount(
            <BasicPropertiesFields model={populatedExistingModel} onInputChange={jest.fn()} />
        );

        expect(basicPropertiesFields.find(SectionHeading)).toHaveLength(1);
        expect(basicPropertiesFields.find(NameInput)).toHaveLength(1);
        expect(basicPropertiesFields.find(DescriptionInput)).toHaveLength(1);
        basicPropertiesFields.unmount();
    });
});

describe('AllowableActions', () => {
    test('new list, default properties', () => {
        const allowableActions = <AllowableActions model={emptyNewModel} onCheckBoxChange={jest.fn()} />;

        const tree = renderer.create(allowableActions).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('existing list, existing properties', () => {
        const allowableActions = <AllowableActions model={populatedExistingModel} onCheckBoxChange={jest.fn()} />;

        const tree = renderer.create(allowableActions).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('visible AllowableActions', () => {
        const allowableActions = mount(
            <AllowableActions model={populatedExistingModel} onCheckBoxChange={jest.fn()} />
        );

        expect(allowableActions.find(CheckBoxRow)).toHaveLength(3);
        allowableActions.unmount();
    });
});
