/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { Set } from 'immutable'
import { QueryGridModel, Tip } from '@glass/base'

import { gridExport } from "../../actions";
import { EXPORT_TYPES } from "../../constants";


/**
 * @model the query grid model from which to export
 * @supportedTypes the types of export formats supported.  Default is CSV, EXCEL and TSV.
 */
interface Props {
    model: QueryGridModel
    supportedTypes?: Set<EXPORT_TYPES> // the types that are supported
}

/**
 * Displays a dropdown button with the different supported export format options.  The default supported types are CSV, EXCEL and TSV.
 */
export class Export extends React.Component<Props, any> {
    static defaultProps = {
        supportedTypes: Set.of(EXPORT_TYPES.CSV, EXPORT_TYPES.EXCEL, EXPORT_TYPES.TSV)
    };

    doExport(type: EXPORT_TYPES) {
        const { model } = this.props;

        return gridExport(model, type);
    }

    render() {
        const { model, supportedTypes } = this.props;

        return (
            model &&
            <Tip caption="Export">
                <DropdownButton
                    id={`export-drop-${model.getId()}`}
                    noCaret
                    pullRight
                    title={<span className="fa fa-download"/>}
                    disabled={model.isError}
                >
                    <MenuItem header>
                        Export {model.selectedQuantity > 0 ? "Selected" : ""}
                    </MenuItem>
                    <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.CSV)}>
                        <span className="fa fa-file-o"/>&nbsp;
                        CSV
                    </MenuItem>
                    <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.EXCEL)}>
                        <span className="fa fa-file-excel-o"/>&nbsp;
                        Excel
                    </MenuItem>
                    <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.TSV)}>
                        <span className="fa fa-file-text-o"/>&nbsp;
                        TSV
                    </MenuItem>
                    { supportedTypes.includes(EXPORT_TYPES.FASTA) ?
                        <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.FASTA)}>
                            <span className="fa-stack" style={{width: '1em', height: '1em', lineHeight: '1em'}}>
                                <span className="fa fa-file-o fa-stack-1x" />
                                <strong className="fa-stack-text file-text fa-stack-1x" style={{fontSize: '0.5em'}}>fa</strong>
                            </span>&nbsp;
                            FASTA
                        </MenuItem> : undefined
                    }
                    { supportedTypes.includes(EXPORT_TYPES.GENBANK) ?
                        <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.GENBANK)}>
                            <span className="fa-stack" style={{width: '1em', height: '1em', lineHeight: '1em'}}>
                                <span className="fa fa-file-o fa-stack-1x" />
                                <strong className="fa-stack-text file-text fa-stack-1x" style={{fontSize: '0.5em'}}>gb</strong>
                            </span>&nbsp;
                            GenBank
                        </MenuItem> : undefined
                    }
                </DropdownButton>
            </Tip>
        )
    }
}