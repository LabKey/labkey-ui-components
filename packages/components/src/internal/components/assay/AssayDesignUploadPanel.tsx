import React, {FC, memo, useMemo, useCallback, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {FileAttachmentForm} from "../../../index";
import {ActionURL} from "@labkey/api";


interface AssayDesignUploadPanelProps {
    onUpload: (file: string) => void
}

export const AssayDesignUploadPanel: FC<AssayDesignUploadPanelProps> = memo(props => {




    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom'}>
                        <b>Import .XAR or .XAR.XML file</b>
                    </div>
                    <p>To create an assay from an existing design, import a .XAR or .XAR.XML file here. You will be able to customize the design after importing.</p>
                    <FileAttachmentForm label={''}/>
                    <div className={'margin-top margin-bottom'}>
                        <b>Import through data pipeline</b>
                    </div>
                    <div className={'margin-top margin-bottom'}>
                        <p>If you have an existing assay .XAR file on this server, you can directly upload this assay design using this folder's data pipeline.</p>
                    </div>
                    <div className={'margin-top'}>
                        <p><a href={ActionURL.buildURL('pipeline', 'browse')}>Use data pipeline</a></p>
                    </div>
                </Col>
            </Row>
        </div>
    )
})
