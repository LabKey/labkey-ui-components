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

import { FileAttachmentForm } from '..';
import inferDomainJson from '../test/data/property-inferDomainWithSpecimenId.json';
import filePreviewJson from '../test/data/property-getFilePreview.json';

import { ALL_FILES_LIMIT_KEY, FileSizeLimitProps } from '../internal/components/files/models';

mock.setup();
mock.post(/.*\/property\/inferDomain.*/, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inferDomainJson),
});
mock.use(proxy);

storiesOf('FileAttachmentForm', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <FileAttachmentForm
                showLabel={boolean('Show label?', true)}
                label={text('Label', 'Attachments')}
                labelLong={text(
                    'Long label (inside of file attachment drop zone)',
                    'Select file or drag and drop here.'
                )}
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
                    acceptedFormats: text('Preview Grid Accepted Formats', '.tsv,.txt,.csv,.xls,.xlsx'),
                }}
            />
        );
    })
    .add('with initial file names and preview data', () => {
        return (
            <FileAttachmentForm
                showLabel={true}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={true}
                showButtons={false}
                previewGridProps={{
                    previewCount: number('Preview Grid Row Count', 3),
                    acceptedFormats: text('Preview Grid Accepted Formats', '.tsv,.txt,.csv,.xls,.xlsx'),
                    initialData: fromJS(filePreviewJson),
                }}
                initialFileNames={['test.txt', 'other.csv']}
            />
        );
    })
    .add('with initial files and preview data', () => {
        const files = {};
        files['test1.txt'] = undefined;
        files['test2.txt'] = undefined;
        return (
            <FileAttachmentForm
                showLabel={true}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={true}
                showButtons={false}
                initialFiles={files}
            />
        );
    })
    .add('with multiple file upload components', () => {
        return (
            <div>
                <FileAttachmentForm
                    index={1}
                    showLabel={true}
                    label="Attachments"
                    acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                    showAcceptedFormats={true}
                    allowMultiple={true}
                    showButtons={false}
                />

                <FileAttachmentForm
                    index={2}
                    showLabel={true}
                    label="Attachments"
                    acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                    showAcceptedFormats={true}
                    allowMultiple={true}
                    showButtons={false}
                />
            </div>
        );
    })
    .add('with all size limits', () => {
        let sizeLimits = Map<string, FileSizeLimitProps>();
        sizeLimits = sizeLimits.set(ALL_FILES_LIMIT_KEY, {
            maxSize: {
                value: 1024,
                displayValue: '1KB',
            },
        });
        return (
            <FileAttachmentForm
                showLabel={true}
                allowDirectories={boolean('Allow folders', true)}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={boolean('Allow multiple files', true)}
                showButtons={boolean('Show buttons', true)}
                sizeLimits={sizeLimits}
                sizeLimitsHelpText={text('Size limits help', undefined)}
            />
        );
    })
    .add('with csv and all size limits', () => {
        let sizeLimits = Map<string, FileSizeLimitProps>();
        sizeLimits = sizeLimits.set(ALL_FILES_LIMIT_KEY, {
            maxSize: {
                value: 1024,
                displayValue: '1KB',
            },
        });
        sizeLimits = sizeLimits.set('.csv', {
            maxSize: {
                value: 512,
                displayValue: '0.5kb',
            },
        });
        return (
            <FileAttachmentForm
                showLabel={true}
                allowDirectories={boolean('Allow folders', true)}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={boolean('Allow multiple files', true)}
                showButtons={boolean('Show buttons', true)}
                sizeLimits={sizeLimits}
                sizeLimitsHelpText={text('Size limits help', undefined)}
            />
        );
    })
    .add('with preview size limits', () => {
        let sizeLimits = Map<string, FileSizeLimitProps>();
        sizeLimits = sizeLimits.set(ALL_FILES_LIMIT_KEY, {
            maxPreviewSize: {
                value: 1024,
                displayValue: '1KB',
            },
        });
        sizeLimits = sizeLimits.set('.csv', {
            maxPreviewSize: {
                value: 512,
                displayValue: '0.5kb',
            },
        });
        return (
            <FileAttachmentForm
                showLabel={true}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={false}
                showButtons={false}
                sizeLimits={sizeLimits}
                previewGridProps={{
                    previewCount: number('Preview Grid Row Count', 3),
                    acceptedFormats: text('Preview Grid Accepted Formats', '.tsv,.txt,.csv,.xls,.xlsx'),
                }}
            />
        );
    })
    .add('with compact size', () => {
        return (
            <FileAttachmentForm
                showLabel={true}
                label="Attachments"
                acceptedFormats=".tsv,.txt,.csv,.xls,.xlsx"
                showAcceptedFormats={true}
                allowMultiple={true}
                showButtons={false}
                compact={true}
            />
        );
    });
