import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';

import { ActionURL } from '@labkey/api';
import { Map } from 'immutable';

import { getHelpLink } from '../../util/helpLinks';
import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';

interface AssayDesignUploadPanelProps {
    onFileChange: (files: Map<string, File>) => void;
    onFileRemove: (name: string) => void;
}

export const AssayDesignUploadPanel: FC<AssayDesignUploadPanelProps> = memo(props => {
    const { onFileChange, onFileRemove, children } = props;

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className="margin-bottom">
                        <b>Import .XAR or .XAR.XML file</b>
                    </div>
                    <p>
                        To create an assay from an existing design, import a{' '}
                        <a href={getHelpLink('XarTutorial')} target="_blank" rel="noopener noreferrer">
                            .XAR or .XAR.XML
                        </a>{' '}
                        file here. You will be able to customize the design after importing.
                    </p>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <FileAttachmentForm
                        acceptedFormats=".XAR, .XAR.XML, .xar, .xar.xml"
                        showAcceptedFormats={false}
                        allowDirectories={false}
                        allowMultiple={false}
                        showLabel={false}
                        onFileChange={onFileChange}
                        onFileRemoval={onFileRemove}
                    />
                </Col>
            </Row>
            {children}
            <Row>
                <Col xs={6}>
                    <div className="margin-top margin-bottom">
                        <b>Import through data pipeline</b>
                    </div>
                    <div className="margin-top margin-bottom">
                        <p>
                            If you have an existing assay .XAR file on this server, you can directly upload this assay
                            design using this folder's data pipeline.
                        </p>
                    </div>
                    <div className="margin-top">
                        <p>
                            <a href={ActionURL.buildURL('pipeline', 'browse')}>Use data pipeline</a>
                        </p>
                    </div>
                </Col>
            </Row>
        </div>
    );
});
