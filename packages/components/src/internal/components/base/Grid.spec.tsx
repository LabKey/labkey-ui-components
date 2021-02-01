/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { fromJS, List } from 'immutable';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { Grid, GridColumn } from './Grid';

const gridData = fromJS([
    {
        name: 'Dee Gordon',
        number: 9,
        position: 4,
    },
    {
        name: 'Mike Zunino',
        number: 3,
        position: 2,
    },
    {
        name: 'Kyle Seager',
        number: 15,
        position: 5,
    },
    {
        name: 'Zero',
        number: 0,
        position: 0,
    }
]);

const gridMessages = fromJS([
    {
        area: 'view',
        type: 'WARNING',
        content: 'There are 1 rows not shown due to unapproved QC state',
    },
]);

const gridColumns = List([
    {
        index: 'name',
        caption: 'Player Name',
    },
    {
        index: 'number',
        caption: 'Number',
    },
    new GridColumn({
        index: 'position',
        title: 'Position',
        cell: posNumber => {
            switch (posNumber) {
                case 0:
                    return 'Bench';
                case 2:
                    return 'C';
                case 4:
                    return '2B';
                case 5:
                    return '3B';
            }

            return `<${posNumber}>`;
        },
    }),
]);

describe('Grid component', () => {
    test('handles empty props', () => {
        const component = shallow(<Grid />);

        expect(component.exists()).toBe(true);
    });

    test('rendering with data', () => {
        const tree = renderer.create(<Grid data={gridData} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('rendering with data and columns', () => {
        const tree = renderer.create(<Grid data={gridData} columns={gridColumns} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('rendering with no data and columns', () => {
        const wrapper = shallow(<Grid data={[]} columns={gridColumns} emptyText="my empty text" gridId="someId" />);
        expect(wrapper.find({ emptyText: 'my empty text' })).toHaveLength(1);
        expect(wrapper.find({ 'data-gridid': 'someId' })).toHaveLength(1);
        const tree = renderer
            .create(<Grid data={[]} columns={gridColumns} emptyText="my empty text" gridId="someId" />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('loading text and action', () => {
        const wrapper = shallow(
            <Grid data={[]} columns={gridColumns} isLoading={true} loadingText="Your data is loading...." />
        );
        expect(wrapper.find({ loadingText: 'Your data is loading....' })).toHaveLength(1);
        expect(wrapper.find({ isLoading: true })).toHaveLength(1);
        const tree = renderer
            .create(<Grid data={[]} columns={gridColumns} isLoading={true} loadingText="You data is loading...." />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with non-default properties', () => {
        const tree = renderer
            .create(
                <Grid
                    data={gridData}
                    columns={gridColumns}
                    bordered={false}
                    calcWidths={true}
                    cellular={true}
                    condensed={true}
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with messages', () => {
        const tree = renderer.create(<Grid data={gridData} messages={gridMessages} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
