import React, { FC, memo, useMemo, useCallback, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, GENERAL_ASSAY_PROVIDER_NAME, getHelpLink } from '../../../index';

import { AssayProvider } from './AssayPicker';

interface SpecialtyAssayPanelProps {
    selected: AssayProvider;
    values: AssayProvider[];
    onChange: (value: string) => void;
    hasPremium: boolean;
    warning?: string;
}

export const SpecialtyAssayPanel: FC<SpecialtyAssayPanelProps> = memo(props => {
    const { values, selected, onChange, warning, children, hasPremium } = props;

    const options = useMemo(() => {
        return values?.filter(v => v.name !== GENERAL_ASSAY_PROVIDER_NAME)
            .map(val => {
                return <option key={val.name} value={val.name}>{val.name}</option>;
            });
    }, [values]);

    const onSelectChange = useCallback(
        e => {
            onChange(e.target.value);
        },
        [onChange]
    );

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className="margin-bottom">
                        <b>Use Instrument Specific Data Format</b>
                    </div>
                    {selected && options?.length > 0 && (
                        <>
                            <div className="margin-bottom">
                                <select
                                    id="specialty-assay-type-select"
                                    value={selected.name}
                                    onChange={onSelectChange}
                                    className="form-control"
                                >
                                    {options}
                                </select>
                            </div>

                            <div className={"small-margin-bottom"} dangerouslySetInnerHTML={{ __html: selected?.description }} />
                        </>
                    )}

                    {warning && (
                        <Alert bsStyle="warning">
                            <i className="fa fa-flag" style={{ marginRight: '20px' }} />
                            {warning}
                        </Alert>
                    )}
                </Col>
            </Row>
            {selected && options?.length > 0 &&
                <Row>
                    <Col xs={6}>
                        <div className={warning ? 'margin-bottom' : 'margin-top margin-bottom'}>
                            <b>Supported File Types</b>
                        </div>
                        <p>{selected?.fileTypes.join(', ')}</p>
                    </Col>
                </Row>
            }
            {children}
            {!hasPremium && (
                <Row>
                    <Col xs={12} className={children ? "margin-top" : ""}>
                        <Alert bsStyle="info">
                            <h1 className="fa fa-star-o"> Premium Feature</h1>
                            <h3>More specialty assays are available with LabKey Server Premium Edition</h3>
                            <hr />
                            <div>
                                <div>Premium users get access to more LabKey specialty assays that could be a match for your
                                    data needs.</div>
                                <div><a className="alert-link" href="https://www.labkey.com/platform/go-premium/"
                                        target="_blank" rel="noopener noreferrer">Learn more about premium editions <i
                                    className="fa fa-external-link"></i></a>
                                </div>
                            </div>
                            <div className="margin-top margin-bottom">
                                <div>LabKey also supports creating your own custom specialty assays. Learn more in our docs,
                                    or contact us for more information on how you can create your own.</div>
                                <div><a className="alert-link" href={getHelpLink('moduleassay')}
                                        target="_blank" rel="noopener noreferrer">Learn more about custom specialty assays <i
                                    className="fa fa-external-link"></i></a></div>
                            </div>
                        </Alert>
                    </Col>
                </Row>
            )}

        </div>
    );
});
