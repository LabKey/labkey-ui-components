import React from "react";
import { Button, FormControl, Modal } from "react-bootstrap";
import { MAX_EDITABLE_GRID_ROWS } from "../../../index";
import {
    SampleCreationTypeOption
} from "./SampleCreationTypeOption";
import { SampleCreationType, SampleCreationTypeModel } from "./models";


interface Props {
    show: boolean;
    options: Array<SampleCreationTypeModel>,
    parentCount: number;
    showIcons: boolean;
    onCancel: () => void;
    onSubmit: (creationType: SampleCreationType, numPerParent?: number) => void;
}

interface State {
    numPerParent: number;
    creationType: SampleCreationType;
    submitting: boolean;
}

export class SampleCreationTypeModal extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            creationType: props.options.find(option => option.selected)?.type || props.options[0].type,
            numPerParent: 1,
            submitting: false,
        }
    }

    onCancel = () => {
        this.props.onCancel();
    };

    onChange = event => {
        const { name, value } = event.target;
        this.setState({ [name]: value } as State);
    };

    renderNumPerParent() : React.ReactNode {
        const { parentCount, options } = this.props;
        const { creationType, numPerParent } = this.state;

        const selectedOption = options.find(option => option.type === creationType);
        return (
            <>
                {this.shouldDisplayOptions() && <hr/>}
                <div>
                    <label className="creation-type-modal-label">{selectedOption.quantityLabel}</label>
                    <label className="creation-type-modal-label">
                        <FormControl
                            className="creation-per-parent-select"
                            min={1}
                            max={MAX_EDITABLE_GRID_ROWS/parentCount}
                            step={1}
                            name={"numPerParent"}
                            onChange={this.onChange}
                            type="number"
                            value={numPerParent}
                        />
                    </label>
                </div>
                Sample details and quantities can be modified on the grid.
            </>
        )
    }

    onConfirm = () => {
        this.props.onSubmit(this.state.creationType, this.state.numPerParent);
    }

    shouldDisplayOptions() : boolean {
        return this.getOptionsToDisplay().length > 1;
    }

    shouldRenderOption(option: SampleCreationTypeModel) : boolean {
        return this.props.parentCount >= option.minParentsPerSample;
    }

    getOptionsToDisplay() : Array<SampleCreationTypeModel> {
        return this.props.options.filter(option => this.shouldRenderOption(option));
    }

    renderOptions() : Array<React.ReactNode> {
        const { showIcons, options } = this.props;
        const displayOptions = this.getOptionsToDisplay();
        if (displayOptions.length < 2)
            return null;

        let optionSet = [];
        displayOptions.forEach((option, i) => {
            optionSet.push(
                <SampleCreationTypeOption
                    key={i}
                    option={option}
                    isSelected={this.state.creationType === option.type}
                    onChoose={this.onChange}
                    showIcon={showIcons}
                />
            )
        });
        return optionSet;
    }

    render() : React.ReactNode {
        const { show, parentCount } = this.props;
        const { submitting, numPerParent } = this.state;

        const parentNoun = parentCount > 1 ? 'Parents' : 'Parent';
        const canSubmit = !submitting && (numPerParent > 0);
        const title = "Create Samples from Selected " + parentNoun;
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
        )
    }
}

