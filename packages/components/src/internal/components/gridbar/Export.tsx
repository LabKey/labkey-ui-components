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
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { Set } from 'immutable';

import { gridExport } from '../../actions';
import { EXPORT_TYPES } from '../../constants';
import { QueryGridModel, Tip } from '../../..';

/**
 * @model the query grid model from which to export
 * @supportedTypes the types of export formats supported.  Default is CSV, EXCEL and TSV.
 */
interface Props {
    model: QueryGridModel;
    supportedTypes?: Set<EXPORT_TYPES>; // the types that are supported
    advancedOption?: Record<string, any>;
    onExport?: Record<number, () => any>;
}

/**
 * Displays a dropdown button with the different supported export format options.  The default supported types are CSV, EXCEL and TSV.
 */
export class Export extends React.Component<Props, any> {
    static defaultProps = {
        supportedTypes: Set.of(EXPORT_TYPES.CSV, EXPORT_TYPES.EXCEL, EXPORT_TYPES.TSV),
    };

    doExport(type: EXPORT_TYPES) {
        const { model, advancedOption, onExport } = this.props;

        if (onExport && onExport[type]) {
            onExport[type]();
        } else {
            gridExport(model, type, advancedOption);
        }
    }

    render() {
        const { model, supportedTypes } = this.props;

        return (
            model && (
                <span className="gridbar-button-spacer">
                    <Tip caption="Export">
                        <DropdownButton
                            id={`export-drop-${model.getId()}`}
                            noCaret
                            pullRight
                            title={<span className="fa fa-download" />}
                            disabled={model.isError}
                        >
                            <MenuItem header>Export {model.selectedQuantity > 0 ? 'Selected' : ''}</MenuItem>
                            <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.CSV)}>
                                <span className="fa fa-file-o" />
                                &nbsp; CSV
                            </MenuItem>
                            <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.EXCEL)}>
                                <span className="fa fa-file-excel-o" />
                                &nbsp; Excel
                            </MenuItem>
                            <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.TSV)}>
                                <span className="fa fa-file-text-o" />
                                &nbsp; TSV
                            </MenuItem>
                            {supportedTypes.includes(EXPORT_TYPES.FASTA) ? (
                                <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.FASTA)}>
                                    <span
                                        className="fa-stack"
                                        style={{ width: '1em', height: '1em', lineHeight: '1em' }}
                                    >
                                        <span className="fa fa-file-o fa-stack-1x" />
                                        <strong
                                            className="fa-stack-text file-text fa-stack-1x"
                                            style={{ fontSize: '0.5em' }}
                                        >
                                            fa
                                        </strong>
                                    </span>
                                    &nbsp; FASTA
                                </MenuItem>
                            ) : undefined}
                            {supportedTypes.includes(EXPORT_TYPES.GENBANK) ? (
                                <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.GENBANK)}>
                                    <span
                                        className="fa-stack"
                                        style={{ width: '1em', height: '1em', lineHeight: '1em' }}
                                    >
                                        <span className="fa fa-file-o fa-stack-1x" />
                                        <strong
                                            className="fa-stack-text file-text fa-stack-1x"
                                            style={{ fontSize: '0.5em' }}
                                        >
                                            gb
                                        </strong>
                                    </span>
                                    &nbsp; GenBank
                                </MenuItem>
                            ) : undefined}
                            {supportedTypes.includes(EXPORT_TYPES.LABEL) ? (
                                <>
                                    <MenuItem header>
                                        Export and Print {model.selectedQuantity > 0 ? 'Selected' : ''}
                                    </MenuItem>
                                    <MenuItem onClick={this.doExport.bind(this, EXPORT_TYPES.LABEL)}>
                                        <span className="fa fa-tag" />
                                        &nbsp; Label
                                    </MenuItem>
                                </>
                            ) : undefined}
                        </DropdownButton>
                    </Tip>
                </span>
            )
        );
    }
}
