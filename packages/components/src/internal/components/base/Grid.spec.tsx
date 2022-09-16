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
import { mount, ReactWrapper, shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { getColumnHoverText, Grid, GridHeader } from './Grid';
import { GridColumn } from './models/GridColumn';
import { LabelHelpTip } from './LabelHelpTip';

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
    },
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

    test('with phi data', () => {
        let columns = gridColumns.push(
            new GridColumn({
                index: 'age',
                title: 'Age',
                raw: {
                    phiProtected: true,
                    description: 'Your age',
                },
            })
        );
        columns = columns.push(
            new GridColumn({
                index: 'teamPlayer',
                title: 'Team Player',
                raw: {
                    description: 'Are you a team player?',
                },
            })
        );
        columns = columns.push(
            new GridColumn({
                index: 'lefty',
                title: 'Lefty',
                raw: {
                    phiProtected: true,
                },
            })
        );
        columns = columns.push(
            new GridColumn({
                index: 'weight',
                title: 'Weight',
                raw: {
                    description: 'Your weight',
                },
                hideTooltip: true,
            })
        );
        const tree = renderer.create(<Grid data={gridData} columns={columns} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('hide tooltip', () => {
        const columns = gridColumns.push(
            new GridColumn({
                index: 'weight',
                title: 'Weight',
                raw: {
                    description: 'Your weight',
                },
                hideTooltip: true,
            })
        );
        const tree = renderer.create(<Grid data={gridData} columns={columns} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});

describe('GridHeader', () => {
    const DEFAULT_PROPS = {
        showHeader: true,
        columns: List.of(
            new GridColumn({ index: 'a', title: 'A', showHeader: true }),
            new GridColumn({ index: 'b', title: 'B', showHeader: true })
        ),
    };

    function validate(wrapper: ReactWrapper, columnCount: number, labelHelpTipCount = 0, draggable = false): void {
        expect(wrapper.find('thead')).toHaveLength(1);
        expect(wrapper.find('.grid-header-cell')).toHaveLength(columnCount);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(labelHelpTipCount);

        if (columnCount > 0) {
            expect(wrapper.find('.grid-header-cell').first().prop('draggable')).toBe(draggable);
        }
    }

    test('default props', () => {
        const wrapper = mount(<GridHeader {...DEFAULT_PROPS} />);
        validate(wrapper, 2);
        wrapper.unmount();
    });

    test('column not showHeader', () => {
        const wrapper = mount(
            <GridHeader
                {...DEFAULT_PROPS}
                columns={List.of(
                    new GridColumn({ index: 'a', title: 'A', showHeader: true }),
                    new GridColumn({ index: 'b', title: 'B', showHeader: false })
                )}
            />
        );
        validate(wrapper, 1);
        wrapper.unmount();
    });

    test('grid not showHeader', () => {
        const wrapper = mount(<GridHeader {...DEFAULT_PROPS} showHeader={false} />);
        validate(wrapper, 0);
        wrapper.unmount();
    });

    test('column helpTipRenderer', () => {
        const wrapper = mount(
            <GridHeader
                {...DEFAULT_PROPS}
                columns={List.of(
                    new GridColumn({ index: 'a', title: 'A', showHeader: true }),
                    new GridColumn({ index: 'b', title: 'B', showHeader: true, helpTipRenderer: 'TestRenderer' })
                )}
            />
        );
        validate(wrapper, 2, 1);
        wrapper.unmount();
    });

    test('draggable', () => {
        const wrapper = mount(<GridHeader {...DEFAULT_PROPS} onColumnDrop={jest.fn} />);
        validate(wrapper, 2, 0, true);
        expect(wrapper.find('.grid-header-drag-over')).toHaveLength(0);
        wrapper.unmount();
    });

    test('dragTarget', () => {
        const wrapper = mount(<GridHeader {...DEFAULT_PROPS} onColumnDrop={jest.fn} />);
        validate(wrapper, 2, 0, true);
        wrapper.setState({ dragTarget: 'b' });
        expect(wrapper.find('.grid-header-drag-over')).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('getColumnHoverText', () => {
    test('no hover text', () => {
        expect(getColumnHoverText({})).toBe(undefined);
        expect(
            getColumnHoverText({
                description: undefined,
                index: undefined,
                phiProtected: undefined,
            })
        ).toBe(undefined);
        expect(
            getColumnHoverText({
                description: '  ',
                index: 'name',
                phiProtected: false,
            })
        ).toBe(undefined);
    });

    test('with hover text', () => {
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'name',
                fieldKeyPath: 'name',
                phiProtected: false,
            })
        ).toBe('desc');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'name',
                fieldKeyPath: 'name',
                phiProtected: true,
            })
        ).toBe('desc  (PHI protected data removed)');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: true,
            })
        ).toBe('desc  (parent/name) (PHI protected data removed)');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: false,
            })
        ).toBe('desc  (parent/name)');
        expect(
            getColumnHoverText({
                description: undefined,
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: false,
            })
        ).toBe('parent/name');
    });
});
