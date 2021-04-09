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

import { isImage, downloadAttachment } from '../..';
import { AttachmentCard, IAttachment } from './AttachmentCard';

interface Props {
    data?: any;
    onRemove?: (attachment: IAttachment) => void;
}

export class FileColumnRenderer extends PureComponent<Props> {
    onDownload = (attachment: IAttachment): void => {
        const { data } = this.props;
        const url = data?.get('url');
        if (url) {
            downloadAttachment(url, true, attachment.name);
        }
    };

    render(): ReactNode {
        const { data, onRemove } = this.props;

        if (!data) {
            return null;
        }

        const url = data.get('url');
        const value = data.get('value');
        const displayValue = data.get('displayValue');
        const name = displayValue || value;

        if (!name) {
            return null;
        }

        // Attachment URLs will look like images, so we check if the URL is an image.
        // FileLink URLs don't look like images, so you have to check value or displayValue.
        const _isImage = (url && isImage(url)) || (displayValue && isImage(displayValue)) || (value && isImage(value));
        const attachment = { name, iconFontCls: _isImage ? 'fa fa-file-image-o' : 'fa fa-file-o' } as IAttachment;

        return (
            <>
                <AttachmentCard
                    attachment={attachment}
                    imageURL={_isImage ? url : undefined}
                    imageCls="attachment-card__img"
                    onDownload={this.onDownload}
                    allowRemove={onRemove !== undefined}
                    onRemove={onRemove}
                />
            </>
        );
    }
}
