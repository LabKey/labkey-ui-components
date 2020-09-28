import React from 'react';
import { List } from 'immutable';
import { Button, Modal } from 'react-bootstrap';

import { ConditionalFormat, PropDescType, PropertyValidator } from '../models';
import {
    DOMAIN_COND_FORMAT,
    DOMAIN_COND_FORMATS,
    DOMAIN_RANGE_VALIDATORS,
    DOMAIN_REGEX_VALIDATOR,
    DOMAIN_REGEX_VALIDATORS,
} from '../constants';
import { AddEntityButton } from '../../buttons/AddEntityButton';

export interface ValidatorModalProps {
    title: string;
    addName: string;
    index: number;
    show: boolean;
    type: string;
    mvEnabled: boolean;
    dataType: PropDescType;
    validators: List<PropertyValidator | ConditionalFormat>;
    onHide: () => any;
    onApply: (validators: List<PropertyValidator | ConditionalFormat>, type: string) => any;
    successBsStyle?: string;
}

interface ValidatorModalState {
    hidden?: boolean;
    expanded: number;
    collapsing: boolean;
    validators: List<PropertyValidator | ConditionalFormat>;
}

export function ValidatorModal(WrappedComponent: any) {
    return class extends React.PureComponent<ValidatorModalProps, ValidatorModalState> {
        constructor(props) {
            super(props);

            this.state = {
                expanded: 0,
                collapsing: false,
                validators: this.initValidators(props.validators),
            };
        }

        initValidators = (validators: List<PropertyValidator | ConditionalFormat>) => {
            if (validators.size < 1) {
                return this.addEmpty(validators);
            }

            return validators;
        };

        handleApply = () => {
            const { onApply, onHide, type } = this.props;
            const { validators } = this.state;

            let validatorType;
            switch (type) {
                case DOMAIN_COND_FORMAT:
                    validatorType = DOMAIN_COND_FORMATS;
                    break;
                case DOMAIN_REGEX_VALIDATOR:
                    validatorType = DOMAIN_REGEX_VALIDATORS;
                    break;
                default:
                    validatorType = DOMAIN_RANGE_VALIDATORS;
                    break;
            }

            onApply(validators, validatorType);
            onHide();
        };

        onChange = (validator: PropertyValidator | ConditionalFormat, index: number) => {
            this.setState(() => ({
                validators: this.state.validators.set(index, validator),
            }));
        };

        isValid = (validators: List<PropertyValidator | ConditionalFormat>) => {
            if (!validators || validators.size < 1) return true;

            return !validators.find(val => WrappedComponent.isValid(val) === false);
        };

        addEmpty = (validators: List<PropertyValidator | ConditionalFormat>) => {
            const { type } = this.props;

            let updatedValidators;
            switch (type) {
                case DOMAIN_COND_FORMAT:
                    updatedValidators = validators.push(new ConditionalFormat());
                    break;
                case DOMAIN_REGEX_VALIDATOR:
                    updatedValidators = validators.push(new PropertyValidator({ type: 'RegEx' }));
                    break;
                default:
                    updatedValidators = validators.push(new PropertyValidator({ type: 'Range' }));
                    break;
            }

            return updatedValidators;
        };

        onAdd = () => {
            const { validators } = this.state;

            this.setState(() => ({ validators: this.addEmpty(validators), expanded: validators.size }));
        };

        onDelete = (index: number) => {
            const { validators } = this.state;

            const updatedValidators = validators.delete(index);
            this.setState(() => ({ validators: updatedValidators, expanded: updatedValidators.size - 1 }));
        };

        onCollapsing = () => {
            this.setState(() => ({ collapsing: true }));
        };

        onCollapsed = () => {
            this.setState(() => ({ collapsing: false }));
        };

        onExpand = (expanded: number) => {
            this.setState(() => ({ expanded }));
        };

        render() {
            const { show, title, onHide, addName, index, dataType, mvEnabled, successBsStyle } = this.props;
            const { expanded, validators } = this.state;

            return (
                <Modal show={show} onHide={onHide}>
                    <Modal.Header closeButton>
                        <Modal.Title>{title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="domain-modal">
                            {validators.map((validator, i) => (
                                <div key={i}>
                                    <WrappedComponent
                                        key={i}
                                        validatorIndex={i}
                                        validator={validator}
                                        index={index}
                                        expanded={i === expanded}
                                        dataType={dataType}
                                        mvEnabled={mvEnabled}
                                        onExpand={this.onExpand}
                                        onChange={this.onChange}
                                        onDelete={this.onDelete}
                                    />
                                </div>
                            ))}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="domain-field-float-left">
                            <AddEntityButton
                                entity={addName}
                                buttonClass="domain-validation-add-btn"
                                onClick={this.onAdd}
                            />
                        </div>
                        <div className="domain-validation-btn-row">
                            <Button onClick={onHide} className="domain-adv-footer domain-adv-cancel-btn">
                                Cancel
                            </Button>
                            <Button
                                bsStyle={successBsStyle || 'success'}
                                onClick={this.handleApply}
                                className="domain-adv-footer domain-adv-apply-btn"
                                disabled={!this.isValid(validators)}
                            >
                                Apply
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>
            );
        }
    };
}
