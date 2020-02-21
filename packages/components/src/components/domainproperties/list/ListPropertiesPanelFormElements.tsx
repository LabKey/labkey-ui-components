import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons/faCheckSquare';
import { faSquare } from '@fortawesome/free-regular-svg-icons/faSquare';

import { LabelHelpTip, ListModel } from '../../..';

interface BasicPropertiesInputsProps {
    model: ListModel;
    onInputChange: (any) => void;
}

class BasicPropertiesTitle extends React.PureComponent<{ title: string }> {
    render() {
        return <div className="domain-field-section-heading">{this.props.title}</div>;
    }
}

class NameInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;

        return (
            <Row style={{ marginTop: '20px', height: '40px' }}>
                <Col xs={3} lg={4}>
                    Name *
                    <LabelHelpTip
                        title=""
                        body={() => {
                            return <> Text to be determined </>;
                        }}
                        required={true}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id="name"
                        type="text"
                        placeholder="Enter a name for this list"
                        value={model.name}
                        onChange={onInputChange}
                        disabled={false}
                    />
                </Col>
            </Row>
        );
    }
}

class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return (
            <Row style={{ marginTop: '20px', height: '40px' }}>
                <Col xs={3} lg={4}>
                    Description
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl id="description" type="text" value={value} onChange={onInputChange} disabled={false} />
                </Col>
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

export class CheckBox extends React.PureComponent<any, any> {
    render() {
        const { onClick, checked } = this.props;

        const checkedOrNot = checked ? (
            <FontAwesomeIcon size="lg" icon={faCheckSquare} color="#0073BB" />
        ) : (
            <FontAwesomeIcon size="lg" icon={faSquare} color="#adadad" />
        );

        return (
            <span style={{ cursor: 'pointer' }} onClick={onClick}>
                {checkedOrNot}
            </span>
        );
    }
}

interface CheckBoxRow {}
class CheckBoxRow extends React.PureComponent<any, any> {
    render() {
        const { checked, onCheckBoxChange, name } = this.props;

        return (
            <div style={{ marginTop: '10px' }}>
                <CheckBox
                    checked={checked}
                    onClick={() => {
                        onCheckBoxChange(name, checked);
                    }}
                />
                <span style={{ marginLeft: '10px' }}>{this.props.text}</span>
            </div>
        );
    }
}

class AllowableActionContainer extends React.PureComponent<any, any> {
    render() {
        const { onCheckBoxChange } = this.props;
        const { allowDelete, allowUpload, allowExport } = this.props.model;

        return (
            <>
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
            </>
        );
    }
}

interface AllowableActionsProps {
    model: ListModel;
    onCheckBoxChange: (name: string, checked: boolean) => void;
}
export class AllowableActions extends React.PureComponent<any, any> {
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
