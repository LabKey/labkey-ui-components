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

import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons/faCheckSquare';
import { faSquare } from '@fortawesome/free-regular-svg-icons/faSquare';
import { ListModel } from './models';
import { BasicPropertiesTitle } from "../PropertiesPanelFormElements";

interface BasicPropertiesInputsProps {
    model: ListModel;
    onInputChange: (any) => void;
}

export class NameInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = (model.name === null) ? "" : model.name;
        return(
            <Row className={'margin-top'}>
                <Col xs={3} lg={2}>
                    Name *
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id="name"
                        type="text"
                        placeholder="Enter a name for this list"
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2}/>
            </Row>
        );
    }
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return(
            <Row className={'margin-top'}>
                <Col xs={3} lg={2}>
                    Description
                </Col>

                <Col xs={9} lg={8}>
                    <textarea
                        className="form-control textarea-noresize"
                        id={'description'}
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2}/>
            </Row>
        );
    }
}

export class BasicPropertiesFields extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        return (
            <Col xs={12} md={7}>
                <BasicPropertiesTitle title="Basic Properties" />

                <NameInput model={model} onInputChange={onInputChange} />

                <DescriptionInput model={model} onInputChange={onInputChange} />
            </Col>
        );
    }
}

interface CheckBoxProps {
    checked: boolean;
    onClick: any;
}
export class CheckBox extends React.PureComponent<CheckBoxProps> {
    render() {
        const { onClick, checked } = this.props;

        const checkedOrNot = checked ? (
            <FontAwesomeIcon size="lg" icon={faCheckSquare} color="#0073BB" />
        ) : (
            <FontAwesomeIcon size="lg" icon={faSquare} color="#adadad" />
        );

        return (
            <span className='list__properties__no-highlight' onClick={onClick}>
                {checkedOrNot}
            </span>
        );
    }
}

interface CheckBoxRowProps {
    checked: boolean;
    onCheckBoxChange: (name, checked) => void;
    name: string;
    text: string;
}

export class CheckBoxRow extends React.PureComponent<CheckBoxRowProps> {
    render() {
        const { checked, onCheckBoxChange, name, text } = this.props;

        return (
            <div className='list__properties__checkbox-row'>
                <CheckBox
                    checked={checked}
                    onClick={() => {
                        onCheckBoxChange(name, checked);
                    }}
                />
                <span className='list__properties__checkbox-text'>{text}</span>
            </div>
        );
    }
}

interface AllowableActionContainerProps {
    model: ListModel;
    onCheckBoxChange: (name, checked) => void;
}
class AllowableActionContainer extends React.PureComponent<AllowableActionContainerProps> {
    render() {
        const { onCheckBoxChange } = this.props;
        const { allowDelete, allowUpload, allowExport } = this.props.model;

        return (
            <div className='list__properties__allowable-actions'>
                <CheckBoxRow
                    text="Delete"
                    checked={allowDelete}
                    onCheckBoxChange={onCheckBoxChange}
                    name="allowDelete"
                />
                <CheckBoxRow
                    text="Upload"
                    checked={allowUpload}
                    onCheckBoxChange={onCheckBoxChange}
                    name="allowUpload"
                />
                <CheckBoxRow
                    text="Export & Print"
                    checked={allowExport}
                    onCheckBoxChange={onCheckBoxChange}
                    name="allowExport"
                />
            </div>
        );
    }
}

interface AllowableActionsProps {
    model: ListModel;
    onCheckBoxChange: (name: string, checked: boolean) => void;
}
export class AllowableActions extends React.PureComponent<AllowableActionsProps> {
    render() {
        return (
            <>
                <Col xs={12} md={3}>
                    <BasicPropertiesTitle title="Allow these Actions" />

                    <AllowableActionContainer model={this.props.model} onCheckBoxChange={this.props.onCheckBoxChange} />
                </Col>
            </>
        );
    }
}
