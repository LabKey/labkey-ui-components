import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { withKnobs, number } from '@storybook/addon-knobs'
import './stories.scss'
import { SchemaQuery } from '@glass/base';
import { PreviewGrid } from '..';


storiesOf('PreviewGrid', module)
    .addDecorator(withKnobs)
    .add("with data", () => {
        const sq = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');
        const numCols = number('numCols', 4);
        const numRows = number('numRows', 3);
        return <PreviewGrid schemaQuery={sq} numCols={numCols} numRows={numRows} />;
    });
