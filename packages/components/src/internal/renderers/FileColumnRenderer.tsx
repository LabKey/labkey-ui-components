/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { ReactNode, PureComponent } from 'react';

import { downloadAttachment, getIconFontCls, isImage } from '../util/utils';
import { FILELINK_RANGE_URI } from '../components/domainproperties/constants';

import { QueryColumn } from '../../public/QueryColumn';

import { AttachmentCard, AttachmentCardProps, IAttachment } from './AttachmentCard';

interface OwnProps {
    col?: QueryColumn;
    data?: any;
    onRemove?: (attachment: IAttachment) => void;
}

interface FileProp {
    fileUnavailable?: boolean;
    filename: string;
}

const getFileDisplayValue = (rawDisplayValue: string): FileProp => {
    if (!rawDisplayValue) {
        return {
            filename: undefined,
            fileUnavailable: false, // not a file_link, could be attachment
        };
    }

    if (rawDisplayValue.endsWith(' (unavailable)')) {
        return {
            filename: rawDisplayValue.substring(0, rawDisplayValue.length - ' (unavailable)'.length),
            fileUnavailable: true,
        };
    }
    return {
        filename: rawDisplayValue,
        fileUnavailable: false,
    };
};

export const getAttachmentCardProp = (
    data?: any,
    colRangeUri?: string,
    onRemove?: (attachment: IAttachment) => void
): AttachmentCardProps => {
    if (!data) return null;

    const url = data.get('url');
    const value = data.get('value');
    const { filename, fileUnavailable } = getFileDisplayValue(data.get('displayValue'));
    const name = filename || value;

    if (!name) {
        return null;
    }

    // Attachment URLs will look like images, so we check if the URL is an image.
    // FileLink URLs don't look like images, so you have to check value or displayValue.
    const _isImage = (url && isImage(url)) || (filename && isImage(filename)) || (value && isImage(value));
    const attachment = {
        name,
        title: getAttachmentTitleFromName(name),
        iconFontCls: getIconFontCls(name, fileUnavailable),
        unavailable: fileUnavailable,
    } as IAttachment;

    return {
        noun: colRangeUri === FILELINK_RANGE_URI ? 'file' : 'attachment',
        attachment,
        imageURL: _isImage ? url : undefined,
        imageCls: 'attachment-card__img',
        allowRemove: onRemove !== undefined,
        onRemove,
    };
};

export class FileColumnRenderer extends PureComponent<OwnProps> {
    onDownload = (attachment: IAttachment): void => {
        const { data } = this.props;
        const url = data?.get('url');
        if (url) {
            downloadAttachment(url, false, attachment.name);
        }
    };

    render(): ReactNode {
        const { col, data, onRemove } = this.props;
        const cardProps = getAttachmentCardProp(data, col?.rangeURI, onRemove);
        if (!cardProps) return null;
        return <AttachmentCard {...cardProps} onDownload={this.onDownload} />;
    }
}

// exported for jest testing
export function getAttachmentTitleFromName(name: string): string {
    if (name.indexOf('/') > -1) {
        return name.substr(name.lastIndexOf('/') + 1);
    }
    // Issue 43725: Windows file name comes through with backslash instead
    else if (name.indexOf('\\') > -1) {
        return name.substr(name.lastIndexOf('\\') + 1);
    }

    return name;
}
