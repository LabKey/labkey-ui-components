import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { AppURL } from "@glass/base";

import { HeatMap } from "../components/heatmap/HeatMap";
import { EXP_TABLES } from "../query/schemas";
import './stories.scss'

storiesOf('HeatMap', module)
    .addDecorator(withKnobs)
    .add("samples with data", () => {
        return (
            <HeatMap
                schemaQuery={EXP_TABLES.SAMPLE_SET_HEAT_MAP}
                nounSingular={'sample'}
                nounPlural={'samples'}
                yAxis={'protocolName'}
                xAxis={'monthName'}
                measure={'monthTotal'}
                yInRangeTotal={'InRangeTotal'}
                yTotalLabel={text('yTotalLabel', '12 month total samples')}
                getCellUrl={(protocolName) => AppURL.create('samples', protocolName.toLowerCase())}
                getHeaderUrl={(cell) => cell.get('url')}
                getTotalUrl={(cell) => cell.get('url')}
                headerClickUrl={AppURL.create('q', 'exp', 'materials')}
                navigate={(url) => console.log(url.toString())}
            />
        )
    })
    .add("assays with data", () => {
        return (
            <HeatMap
                schemaQuery={EXP_TABLES.ASSAY_HEAT_MAP}
                nounSingular={'run'}
                nounPlural={'runs'}
                yAxis={'protocolName'}
                xAxis={'monthName'}
                measure={'monthTotal'}
                yInRangeTotal={'InRangeTotal'}
                yTotalLabel={text('yTotalLabel', '12 month total runs')}
                getCellUrl={(protocolName, providerName) => AppURL.create('assays', providerName, protocolName, 'runs')}
                getHeaderUrl={(cell) => {
                    const provider = cell.get('providerName');
                    const protocol = cell.get('protocolName');
                    return AppURL.create('assays', provider, protocol, 'overview');
                }}
                getTotalUrl={(cell) => {
                    const provider = cell.get('providerName');
                    const protocol = cell.get('protocolName');
                    return AppURL.create('assays', provider, protocol, 'runs');
                }}
                headerClickUrl={AppURL.create('q', 'exp', 'assayruns')}
                navigate={(url) => console.log(url.toString())}
            />
        )
    });