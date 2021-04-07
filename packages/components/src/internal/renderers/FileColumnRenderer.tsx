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
import { Modal } from 'react-bootstrap';

import { isImage, downloadAttachment } from '../..';
import { AttachmentCard, IAttachment } from './AttachmentCard';

interface FileColumnRendererProps {
    data?: any;
}

interface FileColumnRendererState {
    showModal: boolean;
}

export class FileColumnRenderer extends PureComponent<FileColumnRendererProps, FileColumnRendererState> {
    state: Readonly<FileColumnRendererState> = {
        showModal: false,
    };

    onHide = (): void => {
        this.setState({ showModal: false });
    };

    onImageClick = (): void => {
        this.setState({ showModal: true });
    };

    onDownload = (attachment: IAttachment): void => {
        const { data } = this.props;
        const url = data?.get('url');
        if (url) {
            downloadAttachment(url, true, attachment.name);
        }
    };

    render(): ReactNode {
        const { data } = this.props;
        const { showModal } = this.state;

        if (!data) {
            return null;
        }

        const url = data.get('url');
        const value = data.get('value');
        const displayValue = data.get('displayValue');
        const name = displayValue || value;

        // Attachment URLs will look like images, so we check if the URL is an image.
        // FileLink URLs don't look like images, so you have to check value or displayValue.
        if ((url && isImage(url)) || (displayValue && isImage(displayValue)) || (value && isImage(value))) {
            const alt = `${name} image`;
            return (
                <>
                    <AttachmentCard
                        allowRemove={false}
                        attachment={{ name, iconFontCls: 'fa fa-file-image-o' } as IAttachment}
                        imageURL={url}
                        imageCls="file-renderer-img"
                        onClick={this.onImageClick}
                        onDownload={this.onDownload}
                    />

                    <Modal bsSize="large" show={showModal} onHide={this.onHide}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                <a href={url}>{name}</a>
                            </Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <img src={url} alt={alt} title={name} className="file-renderer-img__modal" />
                        </Modal.Body>
                    </Modal>
                </>
            );
        }

        if (!name) {
            return null;
        }

        return (
            <AttachmentCard
                allowRemove={false}
                attachment={{ name, iconFontCls: 'fa fa-file-o' } as IAttachment}
                onDownload={this.onDownload}
            />
        );
    }
}
