import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { EntityDetailsForm } from './EntityDetailsForm';
import { IEntityDetails } from './models';

describe('<EntityDetailsForm/>', () => {
    test('default properties', () => {
        const component = <EntityDetailsForm noun="Entity" onFormChange={jest.fn()} />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('nameExpression properties', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                nameExpressionInfoUrl="www.labkey.org"
                nameExpressionPlaceholder="Enter a name expression"
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('initial data', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                data={fromJS({
                    rowId: 1,
                    name: 'Test Entity Name',
                    description: 'Test Entity Description',
                    nameExpression: 'Test Name Expression',
                })}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with formValues', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                formValues={
                    {
                        'entity-name': 'Test Entity Name',
                        'entity-description': 'Test Entity Description',
                        'entity-nameExpression': 'Test Name Expression',
                    } as IEntityDetails
                }
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with previewName', () => {
        const onNameFieldHover = jest.fn();

        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                data={fromJS({
                    rowId: 1,
                    name: 'Test Entity Name',
                    description: 'Test Entity Description',
                    nameExpression: 'Test Name Expression',
                })}
                onNameFieldHover={onNameFieldHover}
                showPreviewName={true}
                previewName="abc"
            />
        );

        const { container } = render(component);

        expect(document.querySelectorAll('.name-expression-label-div span.domain-no-wrap')).toHaveLength(1);

        expect(container).toMatchSnapshot();
    });
});
