import React, { ReactNode } from 'react';
import { List } from 'immutable';
import { Button, Modal } from 'react-bootstrap';

import { getSubmitButtonClass } from '../../../app/utils';

import { ConditionalFormat, PropertyValidator } from '../models';
import { PropDescType } from '../PropDescType';
import {
    DOMAIN_COND_FORMAT,
    DOMAIN_COND_FORMATS,
    DOMAIN_RANGE_VALIDATORS,
    DOMAIN_REGEX_VALIDATOR,
    DOMAIN_REGEX_VALIDATORS,
} from '../constants';
import { AddEntityButton } from '../../buttons/AddEntityButton';

export interface ValidatorModalProps {
    addName: string;
    dataType: PropDescType;
    // TODO: looks like every component passed to ValidatorModal doesn't use index so it can probably be removed.
    index: number;
    mvEnabled: boolean;
    onApply: (validators: List<PropertyValidator | ConditionalFormat>, type: string) => void;
    onHide: () => void;
    show: boolean;
    title: string;
    type: string;
    validators: List<PropertyValidator | ConditionalFormat>;
}

interface ValidatorModalState {
    expanded: number;
    hidden?: boolean;
    validators: List<PropertyValidator | ConditionalFormat>;
}

export function ValidatorModal(WrappedComponent: any) {
    return class extends React.PureComponent<ValidatorModalProps, ValidatorModalState> {
        constructor(props) {
            super(props);

            this.state = {
                expanded: 0,
                validators: this.initValidators(props.validators),
            };
        }

        initValidators = (validators: List<PropertyValidator | ConditionalFormat>) => {
            if (validators.size < 1) {
                return this.addEmpty(validators);
            }

            return validators;
        };

        handleApply = (): void => {
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

        onChange = (validator: PropertyValidator | ConditionalFormat, index: number): void => {
            this.setState(() => ({
                validators: this.state.validators.set(index, validator),
            }));
        };

        isValid = (validators: List<PropertyValidator | ConditionalFormat>): boolean => {
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

        onAdd = (): void => {
            const { validators } = this.state;

            this.setState(() => ({ validators: this.addEmpty(validators), expanded: validators.size }));
        };

        onDelete = (index: number): void => {
            const { validators } = this.state;

            const updatedValidators = validators.delete(index);
            this.setState(() => ({ validators: updatedValidators, expanded: updatedValidators.size - 1 }));
        };

        onExpand = (expanded: number): void => {
            this.setState(() => ({ expanded }));
        };

        render(): ReactNode {
            const { show, title, onHide, addName, index, dataType, mvEnabled } = this.props;
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
                                bsStyle={getSubmitButtonClass()}
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
