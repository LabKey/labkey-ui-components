import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { Page, PageHeader } from '@glass/base'

import { SchemaListing } from "../components/listing/SchemaListing";
import { QueriesListing } from "../components/listing/QueriesListing";
import './stories.scss'

storiesOf('SchemaBrowser', module)
    .addDecorator(withKnobs)
    .add("schema listing", () => {
        return (
            <Page>
                <PageHeader title={"Schemas"}/>
                <SchemaListing
                    asPanel={boolean('asPanel', false)}
                    title={text('title', undefined)}
                />
            </Page>
        )
    })
    .add("queries listing", () => {
        return (
            <Page>
                <PageHeader title={"Assay Schemas"}/>
                <QueriesListing
                    schemaName={'assay'}
                    asPanel={boolean('asPanel', true)}
                    title={text('title', undefined)}
                />
            </Page>
        )
    });