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
import React from 'react';
import { Modal } from 'react-bootstrap';

interface FileColumnRendererProps {
    data?: any;
}

interface FileColumnRendererState {
    showModal?: boolean;
}

function isImage(value) {
    const validImageExtensions = ['jpg', 'jpeg', 'bmp', 'gif', 'png'];
    const parts = value.split('.');
    const extensionType = parts[parts.length - 1].toLowerCase();

    return validImageExtensions.indexOf(extensionType) > -1;
}

export class FileColumnRenderer extends React.Component<FileColumnRendererProps, FileColumnRendererState> {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
        };
    }

    onHide = () => {
        this.setState({ showModal: false });
    };

    onImageClick = () => {
        this.setState({ showModal: true });
    };

    render() {
        const { data } = this.props;

        if (!data) {
            return null;
        }

        const url = data.get('url');
        const value = data.get('value');
        const displayValue = data.get('displayValue');

        // Attachment URLs will look like images, so we check if the URL is an image.
        // FileLink URLs don't look like images, so you have to check value or displayValue.
        if ((url && isImage(url)) || (displayValue && isImage(displayValue)) || (value && isImage(value))) {
            const title = displayValue || value;
            const alt = `${title} image`;
            return (
                <>
                    <img src={url} alt={alt} title={title} onClick={this.onImageClick} className="file-renderer-img" />

                    <Modal bsSize="large" show={this.state.showModal} onHide={this.onHide}>
                        <Modal.Header closeButton>
                            <Modal.Title>{title}</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <img src={url} alt={alt} title={title} className="file-renderer-img__modal" />
                        </Modal.Body>
                    </Modal>
                </>
            );
        }

        if (!displayValue) {
            return null;
        }

        const content = (
            <span>
                {displayValue}&nbsp;
                <i className="fa fa-file-o" />
            </span>
        );

        if (url) {
            return <a href={url}>{content}</a>;
        }

        return content;
    }
}
