import React from 'react';
import { Button, FormControl, Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { OperationConfirmationData } from '../internal/components/entities/models';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';

import { Alert } from '../internal/components/base/Alert';

import { SampleCreationTypeOption } from './SampleCreationTypeOption';
import { SampleCreationType, SampleCreationTypeModel } from '../internal/components/samples/models';
import { getOperationNotPermittedMessage } from '../internal/components/samples/utils';
import { filterSampleRowsForOperation } from './utils';
import { SampleOperation } from '../internal/components/samples/constants';

interface Props {
    api?: ComponentsAPIWrapper;
    // noun used in modal submit button
    noun?: string;
    nounPlural?: string;
    onCancel: () => void;
    onSubmit: (creationType: SampleCreationType, numPerParent?: number) => void;
    options: SampleCreationTypeModel[];
    parentCount: number;
    selectionData?: Map<any, any>;
    selectionKey?: string;
    show: boolean;
    showIcons: boolean;
}

interface State extends Record<string, any> {
    creationType: SampleCreationType;
    errorMessage: string;
    numPerParent: number;
    statusData: OperationConfirmationData;
    submitting: boolean;
}

export class SampleCreationTypeModal extends React.PureComponent<Props, State> {
    private readonly _maxPerParent;
    // This is used because a user may cancel during the loading phase, in which case we don't want to update state
    private _mounted: boolean;

    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            creationType: props.options.find(option => option.selected)?.type || props.options[0].type,
            numPerParent: 1,
            submitting: false,
            statusData: undefined,
            errorMessage: undefined,
        };
        this._maxPerParent = MAX_EDITABLE_GRID_ROWS / props.parentCount;
    }

    componentDidMount(): void {
        this._mounted = true;
        this.init();
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    init = async (): Promise<void> => {
        const { api, selectionData, selectionKey } = this.props;
        if (selectionData) {
            const { statusData } = filterSampleRowsForOperation(selectionData, SampleOperation.EditLineage);
            if (this._mounted) {
                this.setState({
                    statusData,
                    error: false,
                });
            }
        } else {
            try {
                const confirmationData = await api.samples.getSampleOperationConfirmationData(SampleOperation.EditLineage, undefined, selectionKey);
                if (this._mounted) {
                    this.setState({
                        statusData: confirmationData,
                        error: false,
                    });
                }
            } catch (e) {
                if (this._mounted) {
                    this.setState({
                        error: 'There was a problem retrieving the confirmation data.',
                        isLoading: false,
                    });
                }
            }
        }
    };

    onCancel = (): void => {
        this.props.onCancel();
    };

    onChange = (event: any): void => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    };

    onChooseOption = option => {
        this.setState({ creationType: option.type });
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
        const { show, parentCount, noun, nounPlural } = this.props;
        const { submitting, statusData } = this.state;

        const parentNoun = parentCount > 1 ? 'Parents' : 'Parent';
        const canSubmit = !submitting && this.isValidNumPerParent();
        const title = `${statusData?.noneAllowed ? 'Cannot ' : ''}Create ${
            nounPlural ?? 'Samples'
        } from Selected ${parentNoun}`;
        return (
            <Modal show={show} onHide={this.onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {statusData?.noneAllowed &&
                        getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)}
                    {(statusData?.totalCount == 0 || statusData?.anyAllowed) && (
                        <>
                            {statusData?.anyNotAllowed && (
                                <Alert bsStyle="warning">
                                    {getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)}
                                </Alert>
                            )}
                            {this.renderOptions()}
                            {this.renderNumPerParent()}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    {(statusData?.totalCount == 0 || statusData?.anyAllowed) && (
                        <>
                            <Button bsStyle="default" className="pull-left" onClick={this.onCancel}>
                                Cancel
                            </Button>
                            <Button bsStyle="success" onClick={this.onConfirm} disabled={!canSubmit}>
                                Go to {noun ?? 'Sample'} Creation Grid
                            </Button>
                        </>
                    )}
                    {statusData?.noneAllowed && (
                        <>
                            <Button bsStyle="default" onClick={this.onCancel}>
                                Dismiss
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
}
