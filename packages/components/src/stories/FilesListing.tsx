import * as React from 'react';
import { List, Set } from 'immutable';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';

import { FILES_DATA } from '../test/data/constants';
import { IFile } from '..';
import { FilesListing } from '../internal/components/files/FilesListing';

storiesOf('FilesListing', module)
    .addDecorator(withKnobs)
    .add('with no files', () => {
        return (
            <FilesListing
                files={List<IFile>()}
                noFilesMessage={text('noFilesMessage', undefined)}
                onFileSelection={event => {
                    console.log('selecting ');
                }}
                canDelete={boolean('canDelete', true)}
                onDelete={name => {
                    console.log('delete ' + name);
                }}
                selectedFiles={Set<string>()}
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
            <FilesListing
                files={FILES_DATA}
                noFilesMessage={text('noFilesMessage', undefined)}
                onFileSelection={event => {
                    console.log('selecting ');
                }}
                canDelete={boolean('canDelete', true)}
                onDelete={name => {
                    console.log('delete ' + name);
                }}
                selectedFiles={Set<string>()}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => (
                    <>
                        <b>click me!</b>
                    </>
                )}
            />
        );
    })
    .add('with selection', () => {
        return (
            <FilesListing
                files={FILES_DATA}
                noFilesMessage={text('noFilesMessage', undefined)}
                onFileSelection={event => {
                    console.log('onFileSelection ', event);
                }}
                canDelete={boolean('canDelete', true)}
                onDelete={name => {
                    console.log('delete ' + name);
                }}
                selectedFiles={Set<string>(['exam.xlsx'])}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => (
                    <>
                        <b>click me!</b>
                    </>
                )}
            />
        );
    });
