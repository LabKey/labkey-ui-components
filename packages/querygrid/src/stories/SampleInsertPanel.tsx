import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { Location } from "../util/URL"

import { SampleInsertPanel } from '../components/samples/SampleInsertPanel';

import './stories.scss'

storiesOf('SampleInsertPanel', module)
    .addDecorator(withKnobs)
    .add("No target sample set", () => {
        return <SampleInsertPanel/>;

    })
    .add("Target sample set without parent selections", () => {
        const location : Location = {
            query: {
                target: "Sample Set 2"
            }
        };
        return <SampleInsertPanel
            location={location}
        />;
    })
    // TODO Somehow not all the queries or data or something is right for the use of this selectionKey.
    // .add("Target sample set with parent selection", () => {
    //     const location : Location = {
    //         query: {
    //             target: "Sample Set 2",
    //             selectionKey:"sample-set-name%20expression%20set|samples/name%20expression%20set"
    //         }
    //     };
    //     return <SampleInsertPage
    //         location={location}
    //     />;
    // })
;