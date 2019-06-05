/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, button, number, radios, select, text, withKnobs } from '@storybook/addon-knobs'
import mock, { proxy } from "xhr-mock";

import { FileAttachmentForm } from "../components/files/FileAttachmentForm";
import inferDomainJson from "../test/data/property-inferDomain.json";

import './stories.css'

mock.setup();
mock.post(/.*\/property\/inferDomain.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(inferDomainJson)
});
mock.use(proxy);

storiesOf("FileAttachmentForm", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return (
            <FileAttachmentForm
                showLabel={boolean("Show label?", true)}
                label={text('Label', "Attachments")}
                labelLong={text('Long label (inside of file attachment drop zone)', "Select file or drag and drop here")}
                acceptedFormats={text('Accepted formats', ".tsv,.txt,.csv,.xls,.xlsx")}
                showAcceptedFormats={boolean("Show accepted formats?", true)}
                allowDirectories={boolean("Allow directories?", true)}
                allowMultiple={boolean("Allow multiple?", true)}
                showButtons={boolean("Show buttons?", true)}
                cancelText={text("Cancel button text", "Cancel")}
                submitText={text("Submit button text", "Upload")}
                previewGridProps={{
                    previewCount: number('previewCount', 3)
                }}
            />
        )
    });
