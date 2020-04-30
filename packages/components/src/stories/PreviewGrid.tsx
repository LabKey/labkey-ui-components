import React from 'react';
import { storiesOf } from '@storybook/react';
import { number, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { PreviewGrid } from '../components/PreviewGrid';
import { SchemaQuery } from '../components/base/models/model';

storiesOf('PreviewGrid', module)
    .addDecorator(withKnobs)
    .add('with data', () => {
        const sq = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');
        const numCols = number('numCols', 4);
        const numRows = number('numRows', 3);
        return <PreviewGrid schemaQuery={sq} numCols={numCols} numRows={numRows} />;
    });
