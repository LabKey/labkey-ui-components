import React from 'react';
import { Button, FormControl, Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { MAX_EDITABLE_GRID_ROWS } from '../../../index';

import { SampleCreationTypeOption } from './SampleCreationTypeOption';
import { SampleCreationType, SampleCreationTypeModel } from './models';

interface Props {
    show: boolean;
    options: SampleCreationTypeModel[];
    parentCount: number;
    showIcons: boolean;
    onCancel: () => void;
    onSubmit: (creationType: SampleCreationType, numPerParent?: number) => void;
}

interface State extends Record<string, any> {
    numPerParent: number;
    creationType: SampleCreationType;
    submitting: boolean;
}

export class SampleCreationTypeModal extends React.PureComponent<Props, State> {
    private readonly _maxPerParent;

    constructor(props: Props) {
        super(props);

        this.state = {
            creationType: props.options.find(option => option.selected)?.type || props.options[0].type,
            numPerParent: 1,
            submitting: false,
        };
        this._maxPerParent = MAX_EDITABLE_GRID_ROWS / props.parentCount;
    }

    onCancel = (): void => {
        this.props.onCancel();
    };

    onChange = (event: any): void => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    };

    onChooseOption = option => {
        this.setState({creationType: option.type});
    };

    isValidNumPerParent = (): boolean => {
        const { numPerParent } = this.state;

        return numPerParent >= 1 && numPerParent <= this._maxPerParent;
    };

    renderNumPerParent(): React.ReactNode {
        const { options } = this.props;
        const { creationType, numPerParent } = this.state;

        const selectedOption = options.find(option => option.type === creationType);
        const noun = creationType === SampleCreationType.Aliquots ? 'Aliquot' : 'Sample';
        return (
            <>
                {this.shouldDisplayOptions() && <hr />}
                <div>
                    <label className="creation-type-modal-label">{selectedOption.quantityLabel}</label>
                    <label className="creation-type-modal-label">
                        <FormControl
                            className={classNames('creation-per-parent-select', {
                                'has-error': !this.isValidNumPerParent(),
                            })}
                            min={1}
                            max={this._maxPerParent}
                            step={1}
                            name="numPerParent"
                            onChange={this.onChange}
                            type="number"
                            value={numPerParent}
                        />
                    </label>
                </div>
                {noun} details and quantities can be modified on the grid.
            </>
        );
    }

    onConfirm = (): void => {
        this.props.onSubmit(this.state.creationType, this.state.numPerParent);
    };

    shouldDisplayOptions(): boolean {
        return this.getOptionsToDisplay().length > 1;
    }

    shouldRenderOption(option: SampleCreationTypeModel): boolean {
        return this.props.parentCount >= option.minParentsPerSample;
    }

    getOptionsToDisplay(): SampleCreationTypeModel[] {
        return this.props.options.filter(option => this.shouldRenderOption(option));
    }

    renderOptions(): React.ReactNode[] {
        const { showIcons } = this.props;
        const displayOptions = this.getOptionsToDisplay();
        if (displayOptions.length < 2) return null;

        const optionSet = [];
        displayOptions.forEach((option, i) => {
            optionSet.push(
                <SampleCreationTypeOption
                    key={i}
                    option={option}
                    isSelected={this.state.creationType === option.type}
                    onChoose={this.onChooseOption}
                    showIcon={showIcons}
                />
            );
        });
        return optionSet;
    }

    render(): React.ReactNode {
        const { show, parentCount } = this.props;
        const { submitting } = this.state;

        const parentNoun = parentCount > 1 ? 'Parents' : 'Parent';
        const canSubmit = !submitting && this.isValidNumPerParent();
        const title = 'Create Samples from Selected ' + parentNoun;
        return (
            <Modal show={show} onHide={this.onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {this.renderOptions()}
                    {this.renderNumPerParent()}
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="default" className="pull-left" onClick={this.onCancel}>
                        Cancel
                    </Button>
                    <Button bsStyle="success" onClick={this.onConfirm} disabled={!canSubmit}>
                        Go to Sample Creation Grid
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
