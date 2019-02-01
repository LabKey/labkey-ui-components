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
import * as React from 'react'
import { Modal } from 'react-bootstrap'

interface FileColumnRendererProps{
    data?: any
}

interface FileColumnRendererState {
    showModal?: boolean
}

export class FileColumnRenderer extends React.Component<FileColumnRendererProps, FileColumnRendererState> {

    constructor(props) {
        super(props);

        this.state = {
            showModal: false
        }
    }

    onHide() {
        this.setState({
            showModal: false
        });
    }

    onImageClick() {
        this.setState({
            showModal: true
        });
    }

    verifyImage() {
        const { data } = this.props;
        const file = data.get('displayValue');

        const validImageExtensions = ['jpg', 'jpeg', 'bmp', 'gif', 'png'],
            extensionLength = file.split('.').length,
            extensionType = file.split('.')[extensionLength - 1];

        return validImageExtensions.indexOf(extensionType) > -1;
    }

    renderFileType() {
        const { data } = this.props;
        if (data && data.has('displayValue')) {
            if (this.verifyImage()) {
                return (
                    <div>
                        <img src={data.get('url')}
                             alt={data.get('displayValue')+' image'}
                             title={data.get('displayValue')}
                             onClick={this.onImageClick.bind(this)}
                             className="file-renderer-img"
                        />
                        <Modal bsSize="large"
                               show={this.state.showModal}
                               onHide={this.onHide.bind(this)}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>
                                    {data.get('displayValue')}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <img src={data.get('url')}
                                     alt={data.get('displayValue')+' image'}
                                     title={data.get('displayValue')}
                                     className="file-renderer-img__modal"
                                />
                            </Modal.Body>
                        </Modal>
                    </div>
                )
            }

            let content = (
                <span>
                    {data.get('displayValue')}&nbsp;<i className="fa fa-file-o"/>
                </span>
            );

            if (data.get('url')) {
                return (
                    <a href={data.get('url')}>
                        {content}
                    </a>
                );
            }

            return content;
        }
    }

    render() {

        return (
            <div>
                {this.renderFileType()}
            </div>
        )
    }
}