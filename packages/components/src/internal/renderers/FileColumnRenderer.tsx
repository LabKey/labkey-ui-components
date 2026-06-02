/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode, PureComponent } from 'react';
import { Iterable } from 'immutable';

import { caseInsensitive, downloadAttachment, getDataStyling, getIconFontCls, isImage } from '../util/utils';

import { AttachmentCard, AttachmentCardProps, IAttachment } from './AttachmentCard';
import { isConditionalFormattingEnabled } from '../app/utils';

interface OwnProps {
    data?: any;
    isFileLink?: boolean;
    onRemove?: (attachment: IAttachment) => void;
}

interface FileProp {
    fileUnavailable?: boolean;
    filename: string;
}

const UNAVAILABLE_FILE_SUFFIX = ' (unavailable)';
const getFileDisplayValue = (rawDisplayValue: string): FileProp => {
    if (rawDisplayValue?.endsWith(UNAVAILABLE_FILE_SUFFIX)) {
        return {
            filename: rawDisplayValue.substring(0, rawDisplayValue.length - UNAVAILABLE_FILE_SUFFIX.length),
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
    isFileLink?: boolean,
    onRemove?: (attachment: IAttachment) => void
): AttachmentCardProps => {
    if (!data) return null;

    let url, value, display;
    if (Iterable.isIterable(data)) {
        url = data.get('url');
        value = data.get('value')?.toString();
        display = getFileDisplayValue(data.get('displayValue') ?? value);
    } else {
        url = caseInsensitive(data, 'url');
        value = caseInsensitive(data, 'value')?.toString();
        display = getFileDisplayValue(caseInsensitive(data, 'displayValue') ?? value);
    }
    const titleStyle = isConditionalFormattingEnabled() ? getDataStyling(data) : undefined;
    const filename = display.filename;
    const fileUnavailable = display.fileUnavailable;
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
        noun: isFileLink ? 'file' : 'attachment',
        attachment,
        imageURL: _isImage ? url : undefined,
        imageCls: 'attachment-card__img',
        allowRemove: onRemove !== undefined,
        titleStyle,
        onRemove,
    };
};

export class FileColumnRenderer extends PureComponent<OwnProps> {
    onDownload = (attachment: IAttachment): void => {
        const { data } = this.props;
        const url = Iterable.isIterable(data) ? data?.get('url') : caseInsensitive(data, 'url');
        if (url) {
            downloadAttachment(url, false, attachment.name);
        }
    };

    render(): ReactNode {
        const { isFileLink, data, onRemove } = this.props;
        const cardProps = getAttachmentCardProp(data, isFileLink, onRemove);
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
