import * as React from 'react'
import { List } from 'immutable'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import './stories.scss';
import { FilesListing } from "../components/files/FilesListing";
import { IFile } from "..";
import { FILES_DATA } from "../test/data/constants";

storiesOf("FilesListing", module)
    .addDecorator(withKnobs)
    .add("with no files", () => {

        return (
            <FilesListing
                files={List<IFile>()}
                handleUpload={() => {}}
                handleDelete={() => {}}
                handleDownload={() => {}}

                addFileText={text('addFileText', undefined)}
                noFilesMessage={text('noFilesMessage', undefined)}
                canInsert={boolean('canInsert', true)}
                canDelete={boolean('canDelete', true)}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => <><b>click me!</b></>}
            />
        )
    })
    .add("with files", () => {
        return (
            <FilesListing
                files={FILES_DATA}
                handleUpload={() => {}}
                handleDelete={() => {}}
                handleDownload={() => {}}
                addFileText={text('addFileText', undefined)}
                noFilesMessage={text('noFilesMessage', undefined)}
                canInsert={boolean('canInsert', true)}
                canDelete={boolean('canDelete', true)}
                useFilePropertiesEditTrigger={boolean('useFilePropertiesEditTrigger', true)}
                getFilePropertiesEditTrigger={() => <><b>click me!</b></>}
            />
        )
    });