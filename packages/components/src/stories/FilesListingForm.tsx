import React from 'react';
import { List } from 'immutable';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { FilesListingForm } from '../internal/components/files/FilesListingForm';
import { FILES_DATA, FILES_DATA_2 } from '../test/data/constants';
import { IFile } from '..';

storiesOf('FilesListingForm', module)
    .addDecorator(withKnobs)
    .add('with no files', () => {
        return (
            <FilesListingForm
                files={List<IFile>()}
                handleUpload={() => {}}
                handleDelete={() => {}}
                handleDownload={() => {}}
                addFileText={text('addFileText', undefined)}
                noFilesMessage={text('noFilesMessage', 'No files currently attached.')}
                canInsert={boolean('canInsert', true)}
                canDelete={boolean('canDelete', true)}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => (
                    <>
                        <b>click me!</b>
                    </>
                )}
            />
        );
    })
    .add('with files', () => {
        return (
            <FilesListingForm
                files={FILES_DATA}
                handleUpload={() => {}}
                handleDelete={() => {}}
                handleDownload={() => {}}
                addFileText={text('addFileText', undefined)}
                noFilesMessage={text('noFilesMessage', 'No files currently attached.')}
                canInsert={boolean('canInsert', true)}
                canDelete={boolean('canDelete', true)}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => (
                    <>
                        <b>click me!</b>
                    </>
                )}
            />
        );
    })
    .add('with readOnly files', () => {
        return (
            <FilesListingForm
                files={FILES_DATA}
                readOnlyFiles={FILES_DATA_2}
                headerText={text('headerText', 'Editable files')}
                readOnlyHeaderText={text('readOnlyHeaderText', 'Read-only files')}
                handleUpload={() => {}}
                handleDelete={() => {}}
                handleDownload={() => {}}
                addFileText={text('addFileText', undefined)}
                noFilesMessage={text('noFilesMessage', 'No files currently attached.')}
                canInsert={boolean('canInsert', true)}
                canDelete={boolean('canDelete', true)}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => (
                    <>
                        <b>click me!</b>
                    </>
                )}
            />
        );
    });
