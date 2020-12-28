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
import { fromJS, List, Map } from 'immutable';
import { Meta, Story } from '@storybook/react/types-6-0';

import { Grid, GridColumn } from '..';

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
]);

const gridMessages = fromJS([
    {
        area: 'view',
        content: 'There are 1 rows not shown due to unapproved QC state',
        type: 'WARNING',
    },
]);

export default {
    title: 'Components/Grid',
    component: Grid,
    argTypes: {
        data: {
            control: { disable: true },
            table: { disable: true },
        },
        columns: {
            control: { disable: true },
            table: { disable: true },
        },
        messages: {
            defaultValue: List<Map<string, string>>(),
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

const Template: Story = props => <Grid {...(props as any)} />;

export const WithBasicData = Template.bind({});
WithBasicData.storyName = 'With basic data';

WithBasicData.args = {
    data: gridData,
};

export const WithColumns = Template.bind({});
WithColumns.storyName = 'With columns';

WithColumns.args = {
    ...WithBasicData.args,
    columns: gridColumns,
};

export const WithMessages = Template.bind({});
WithMessages.storyName = 'With messages';

WithMessages.args = {
    ...WithColumns.args,
    messages: gridMessages,
};
