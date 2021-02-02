import React from 'react';
import { Option } from 'react-select';
import { storiesOf } from '@storybook/react';

import { SelectInput, QuerySelect, SchemaQuery } from '..';

const DATA_CLASSES = {
    INGREDIENTS: SchemaQuery.create('exp.data', 'expressionsystem'),
    MIXTURES: SchemaQuery.create('exp.data', 'mixtures'),
};
export const INGREDIENT_TYPE_OPTIONS: Option[] = [
    {
        label: 'Ingredient',
        value: 'ingredients',
    },
    {
        label: 'Mixture',
        value: 'mixtures',
    },
];

interface State {
    type: string;
    ingredient: string;
}

class QuerySelectWrapper extends React.PureComponent<any, State> {
    constructor(props) {
        super(props);

        this.state = {
            type: undefined,
            ingredient: undefined,
        };
    }

    filterOptions = options => {
        return options;
    };

    onTypeChange = (name, type) => {
        this.setState(() => ({ type }));
    };

    onIngredientChange = (name, ingredient) => {
        this.setState(() => ({ ingredient }));
    };

    render() {
        const { type } = this.state;

        return (
            <div className="col-xs-10">
                <SelectInput
                    containerClass=""
                    formsy={false}
                    inputClass="col-xs-4 test-loc-ingredient-type"
                    name="ingredientType"
                    onChange={this.onTypeChange}
                    options={INGREDIENT_TYPE_OPTIONS}
                    placeholder="Select type ..."
                    showLabel={false}
                    value={type}
                />

                <QuerySelect
                    componentId={type + '_added'}
                    containerClass="row"
                    disabled={type === undefined || type === ''}
                    filterOptions={this.filterOptions}
                    formsy={false}
                    inputClass="col-xs-6 test-loc-ingredient"
                    name={'added_' + type}
                    onQSChange={this.onIngredientChange}
                    preLoad
                    previewOptions
                    schemaQuery={type ? DATA_CLASSES[type.toUpperCase()] : ''}
                    showLabel={false}
                    valueColumn="Name"
                    showLoading={false}
                    loadOnChange={false}
                />
            </div>
        );
    }
}

storiesOf('QuerySelect', module).add('with data', () => {
    return <QuerySelectWrapper />;
});
