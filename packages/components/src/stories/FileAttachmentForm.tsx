/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { fromJS, Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';
import mock, { proxy } from 'xhr-mock';

import { FileAttachmentForm } from '../components/files/FileAttachmentForm';
import inferDomainJson from '../test/data/property-inferDomainWithSpecimenId.json';
import filePreviewJson from '../test/data/property-getFilePreview.json';

import './stories.scss';

mock.setup();
mock.post(/.*\/property\/inferDomain.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(inferDomainJson)
});
mock.use(proxy);

storiesOf('FileAttachmentForm', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <FileAttachmentForm
                showLabel={boolean('Show label?', true)}
                label={text('Label', 'Attachments')}
                labelLong={text('Long label (inside of file attachment drop zone)', 'Select file or drag and drop here')}
                acceptedFormats={text('Accepted formats', '.tsv,.txt,.csv,.xls,.xlsx')}
                showAcceptedFormats={boolean('Show accepted formats?', true)}
                allowDirectories={boolean('Allow directories?', true)}
                allowMultiple={boolean('Allow multiple?', true)}
                showButtons={boolean('Show buttons?', true)}
                cancelText={text('Cancel button text', 'Cancel')}
                submitText={text('Submit button text', 'Upload')}
                templateUrl={text('Download Template URL', '#downloadtemplate')}
                previewGridProps={{
                    previewCount: number('Preview Grid Row Count', 3),
                    acceptedFormats: text('Preview Grid Accepted Formats', '.tsv,.txt,.csv,.xls,.xlsx')
                }}
            />
        )
    })
    .add("with initial file names and preview data", () => {
        return (
            <FileAttachmentForm
                showLabel={true}
                label={'Attachments'}
                labelLong={'Select file or drag and drop here'}
                acceptedFormats={'.tsv,.txt,.csv,.xls,.xlsx'}
                showAcceptedFormats={true}
                allowMultiple={true}
                showButtons={false}
                previewGridProps={{
                    previewCount: number('Preview Grid Row Count', 3),
                    acceptedFormats: text('Preview Grid Accepted Formats', '.tsv,.txt,.csv,.xls,.xlsx'),
                    initialData: fromJS(filePreviewJson)
                }}
                initialFileNames={["test.txt", "other.csv"]}
            />
        )
    })
    .add("with initial files and preview data", () => {
        let files = {};
        files["test1.txt"] = undefined;
        files["test2.txt"] = undefined;
        return (
            <FileAttachmentForm
                showLabel={true}
                label={'Attachments'}
                labelLong={'Select file or drag and drop here'}
                acceptedFormats={'.tsv,.txt,.csv,.xls,.xlsx'}
                showAcceptedFormats={true}
                allowMultiple={true}
                showButtons={false}
                initialFiles={files}
            />
        )
    })
;
