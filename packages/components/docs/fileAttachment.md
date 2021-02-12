# FileAttachmentForm

Rendering FileAttachmentForm component allows users to select files to be uploaded to the server
via file selection or drag & drop.
Users can then utilize our WebDAV API to upload or retrieve existing uploads -
example [here](./webdav.md).

## [FileAttachmentForm](../src/public/files/FileAttachmentForm.tsx#L71)
```tsx
import React, { FC, memo, useCallback } from 'react';
import { Panel } from 'react-bootstrap';
import { FileAttachmentForm } from '@labkey/components';
import { Map } from 'immutable';
import { Draft, produce } from 'immer';

export class MyAttachmentModel {
    [immerable] = true;

    readonly filesToUpload?: Map<string, File>; // to upload files to the server

    constructor(values?: Partial<MyAttachmentModel>) {
        Object.assign(this, values);
    }

    static create(raw?: any): MyAttachmentModel {
        return new MyAttachmentModel({ ...raw });
    }
}

interface Props {
    model: MyAttachmentModel;
    onInputChange: (model: MyAttachmentModel) => void;
}

// Functional component which would be rendered as part of the parent component
export const MyAttachmentPanel: FC<Props> = memo((props) => {
    const { model, onInputChange } = props;

    const onFileChange = useCallback((files: Map<string, File>) => {
        const updatedModel = produce(model, (draft: Draft<MyAttachmentModel>) => {
            draft['filesToUpload'] = files;
        });
        onInputChange(updatedModel);

    }, [model, onInputChange]);

    return (
        <FileAttachmentForm
            acceptedFormats=".pdf, .jpg"
            allowDirectories={false}
            allowMultiple={true}
            showLabel={false}
            onFileChange={onFileChange}
        />
    );
})
```
