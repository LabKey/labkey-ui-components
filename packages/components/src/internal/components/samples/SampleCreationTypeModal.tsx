import React from "react";
import {Button, FormControl, Modal} from "react-bootstrap";
import {MAX_EDITABLE_GRID_ROWS} from "../../../index";
import {
    CREATION_TYPE_OPTIONS,
    CreationType,
    CreationTypeModel,
    SampleCreationTypeOption
} from "./SampleCreationTypeOption";


interface Props {
    show: boolean;
    allowAliquots: boolean; // temporary.  We'll remove this when we actually support aliquots
    parentCount: number;
    showIcons: boolean;
    onCancel: () => void;
    onSubmit: (creationType: CreationType, numPerParent?: number) => void;
}

interface State {
    numPerParent: number;
    creationType: CreationType;
    submitting: boolean;
}

export class SampleCreationTypeModal extends React.PureComponent<Props, State> {

    static defaultProps = {
        allowAliquots: false
    }

    state: Readonly<State> = {
        creationType: CreationType.Derivatives,
        numPerParent: 1,
        submitting: false,
    };

    onCancel = () => {
        this.props.onCancel();
    };

    onChange = event => {
        const { name, value } = event.target;
        this.setState({ [name]: value } as State);
    };

    renderNumPerParent() : React.ReactNode {
        const { parentCount } = this.props;
        const { creationType, numPerParent } = this.state;

        if (creationType == CreationType.PooledSamples)
            return null;

        return (
            <>
                {this.shouldDisplayOptions() && <hr/>}
                <div>
                    <label className="creation-type-modal-label">{creationType} per parent</label>
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

    shouldDisplayOptions() : boolean {
        return this.props.parentCount > 1 || this.props.allowAliquots;
    }

    onConfirm = () => {
        this.props.onSubmit(this.state.creationType, this.state.numPerParent);
    }

    shouldRenderOption(option: CreationTypeModel) : boolean {
        if (option.requiresMultipleParents && this.props.parentCount <= 1)
            return false;
        return option.type != CreationType.Aliquots || this.props.allowAliquots;
    }

    renderOptions() {
        const { showIcons } = this.props;
        let options = [];
        CREATION_TYPE_OPTIONS.forEach((option, i) => {
            if (this.shouldRenderOption(option)) {
                options.push(
                    <SampleCreationTypeOption
                        key={i}
                        option={option}
                        isSelected={this.state.creationType === option.type}
                        onChoose={this.onChange}
                        showIcon={showIcons}
                    />
                )
            }
        });
        return options;
    }

    render() : React.ReactNode {
        const { show, parentCount } = this.props;
        const { submitting, creationType, numPerParent } = this.state;

        const parentNoun = parentCount > 1 ? 'Parents' : 'Parent';
        const canSubmit = !submitting && (creationType == CreationType.PooledSamples || numPerParent > 0);
        const title = "Create Samples from Selected " + parentNoun;
        return (
            <Modal show={show} onHide={this.onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {this.shouldDisplayOptions() &&
                    <div>
                        {this.renderOptions()}
                    </div>
                    }
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

