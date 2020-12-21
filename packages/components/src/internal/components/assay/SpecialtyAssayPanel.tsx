import React, {FC, memo, useMemo, useCallback, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {Alert} from "../../../index";

export interface SpecialtyAssaySelectOption {
    value: string
    display: string
    description: string
    fileTypes: Array<string>
}

interface SpecialtyAssayPanelProps {
    selected: SpecialtyAssaySelectOption
    values: Array<SpecialtyAssaySelectOption>
    onChange: (value: string) => void
    warning?: string
}

export const SpecialtyAssayPanel: FC<SpecialtyAssayPanelProps> = memo(props => {
    const { values, selected, onChange, warning, children } = props;

    const options = useMemo(() => {
        return values.map(val => {
            return <option value={val.value}>{val.display}</option>
        })
    }, [values])

    const onSelectChange = useCallback((e) => {
        onChange(e.target.value);
    }, [onChange])

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom'}>
                        <b>Use Instrument Specific Data Format</b>
                    </div>
                    <div className={'margin-bottom'}>
                        {selected &&
                            <select value={selected.value} onChange={onSelectChange} className={"form-control"}>
                                {options}
                            </select>
                        }
                    </div>
                    <p>{selected?.description}</p>
                    {warning &&
                        <Alert bsStyle={'warning'}>
                            <i className="fa fa-flag" style={{marginRight: '20px'}}/>{warning}
                        </Alert>
                    }
                </Col>
            </Row>
            <Row>
                <Col xs={6}>
                    <div className={warning ? 'margin-bottom' : 'margin-top margin-bottom' }>
                        <b>Supported File Types</b>
                    </div>
                    <p>{selected?.fileTypes.join(', ')}</p>
                </Col>
            </Row>
            {children}
        </div>
    )
})
