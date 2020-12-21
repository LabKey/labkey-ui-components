import React, { FC, memo, useMemo, useCallback } from "react";
import { Col, Row } from "react-bootstrap";

export interface SelectOption {
    value: string
    display: string
}

interface AssayContainerLocationProps {
    selected?: string
    values: Array<SelectOption>
    onChange: (value: string) => void
}

export const AssayContainerLocation: FC<AssayContainerLocationProps> = memo(props => {
    const { values, selected, onChange } = props;

    const options = useMemo(() => {
        return values.map(val => {
            return <option value={val.value}>{val.display}</option>
        })
    }, [values])

    const onSelectChange = useCallback((e) => {
        onChange(e.target.value);
    }, [onChange])

    return (
        <div className={'margin-top'}>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom'}><b>Assay Location</b></div>
                    <p>Choose where the assay will be used and visible within subfolders</p>
                    <select value={selected} onChange={onSelectChange} className={"form-control"}>
                        {options}
                    </select>
                </Col>
            </Row>
        </div>
    )
})
