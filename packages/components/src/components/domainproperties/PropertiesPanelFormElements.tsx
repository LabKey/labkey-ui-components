/*
 * Copyright (c) 2020 LabKey Corporation
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

import React from "react";
import {Col, FormControl, Row} from "react-bootstrap";

interface BasicPropertiesTitleProps {
    title: string
}

export class BasicPropertiesTitle extends React.PureComponent<BasicPropertiesTitleProps> {
    render() {
        return <div className="domain-field-section-heading">{this.props.title}</div>;
    }
}

interface TextInputWithLabelProps {
    name: string,
    value?: string,
    placeholder?: string
    onInputChange: (any) => void;
}

export class TextInputWithLabel extends React.PureComponent<TextInputWithLabelProps> {
    render() {
        const { name, placeholder, onInputChange } = this.props;
        let value = this.props.value ? this.props.value : "";

        return(
            <Row className={'margin-top'}>
                <Col xs={3} lg={2}>
                    {name}
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id={name}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2}/>
            </Row>
        );
    }
}
