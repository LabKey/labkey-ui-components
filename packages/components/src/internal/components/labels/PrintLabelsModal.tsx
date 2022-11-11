import React, { PureComponent } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { List } from 'immutable';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { HelpLink } from '../../util/helpLinks';
import { QuerySelect } from '../forms/QuerySelect';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { BarTenderResponse } from './models';
import { BAR_TENDER_TOPIC, LABEL_NOT_FOUND_ERROR } from './constants';

export interface PrintModalProps {
    afterPrint?: (numSamples: number, numLabels: number) => void;
    api?: ComponentsAPIWrapper;
    labelTemplate: string;
    onCancel?: (any) => void;
    model?: QueryModel; // must provide either a model or schemaName/queryName
    printServiceUrl: string;
    queryName?: string;
    sampleIds: string[];
    schemaName?: string;
    show: boolean;
    showSelection: boolean;
}

interface State {
    error: any;
    labelTemplate: string;
    numCopies: number;
    sampleCount: number;
    submitting: boolean;
}

const PRINT_ERROR_MESSAGE =
    'There was a problem printing the labels for the selected samples. Verify the label template chosen is still valid and the connection to BarTender has been configured properly.';

export class PrintLabelsModalImpl extends PureComponent<PrintModalProps & InjectedQueryModels, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    _modelId = 'sampleModel';

    constructor(props: PrintModalProps & InjectedQueryModels) {
        super(props);

        // because of a timing issue with the clearSelections on componentWillUnmount, use distinct model ids for single sample vs grid selection case
        if (!props.showSelection) {
            this._modelId = 'singleSampleModel';
        }

        this.state = {
            submitting: false,
            error: undefined,
            numCopies: 1,
            labelTemplate: props.labelTemplate,
            sampleCount: props.sampleIds.length,
        };
    }

    componentDidMount() {
        const { model, schemaName, queryName } = this.props;

        this.props.actions.addModel(
            {
                id: this._modelId,
                schemaQuery: model?.schemaQuery ?? SchemaQuery.create(schemaName, queryName),
                baseFilters: model?.filters,
            },
            true,
            true
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.getModel().isLoading && prevProps.queryModels[this._modelId].isLoading) {
            this.props.actions.setSelections(this._modelId, true, this.props.sampleIds);
        }
    }

    componentWillUnmount() {
        this.props.actions.clearSelections(this._modelId);
    }

    getModel() {
        return this.props.queryModels[this._modelId];
    }

    getSampleCount() {
        return this.state.sampleCount;
    }

    onCopyCountChange = event => {
        let numCopies = parseInt(event.target.value);

        if (isNaN(numCopies)) {
            numCopies = undefined;
        }

        this.setState(() => ({ numCopies }));
    };

    onLabelTemplateChange = event => {
        const labelTemplate = event.target.value;
        this.setState(() => ({ labelTemplate }));
    };

    onConfirmPrint = (): void => {
        this.setState(() => ({ error: undefined, submitting: true }));
        const labelTemplate = this.state.labelTemplate.trim();
        this.props.api.labelprinting
            .printGridLabels(this.getModel(), labelTemplate, this.state.numCopies, this.props.printServiceUrl)
            .then((btResponse: BarTenderResponse): void => {
                if (btResponse.ranToCompletion()) {
                    this.onLabelPrintSuccess();
                } else if (btResponse.faulted() && btResponse.isLabelUnavailableError(labelTemplate)) {
                    this.onLabelPrintError(btResponse.getFaultMessage(), LABEL_NOT_FOUND_ERROR);
                } else {
                    this.onLabelPrintError(btResponse.getFaultMessage());
                }
            })
            .catch(reason => {
                this.onLabelPrintError(reason);
            });
    };

    onLabelPrintSuccess = (): void => {
        const { afterPrint } = this.props;
        const { sampleCount } = this.state;

        this.setState(() => ({ submitting: false }));
        if (afterPrint) {
            afterPrint(sampleCount, sampleCount > 0 ? this.state.numCopies * sampleCount : this.state.numCopies);
        }
    };

    onLabelPrintError = (reason: string, errorMessage?: string): void => {
        console.error(reason);
        this.setState(() => ({
            submitting: false,
            error: errorMessage || PRINT_ERROR_MESSAGE,
        }));
    };

    getTitle(): string {
        const numSamples = this.getSampleCount();

        if (numSamples === 0) {
            return 'Print Labels with BarTender';
        } else {
            return 'Print Labels for ' + numSamples + (numSamples === 1 ? ' Sample' : ' Samples') + ' with BarTender';
        }
    }

    changeSampleSelection = (name: string, value: string) => {
        const sampleIds = value ? value.split(',') : [];
        this.setState(() => ({ sampleCount: sampleIds.length }));
        this.props.actions.replaceSelections(this._modelId, sampleIds);
    };

    isReadyForPrint(): boolean {
        const { labelTemplate, numCopies } = this.state;
        return (
            labelTemplate !== undefined &&
            labelTemplate.trim().length > 0 &&
            numCopies !== undefined &&
            numCopies > 0 &&
            this.getSampleCount() > 0
        );
    }

    renderForm() {
        const { showSelection } = this.props;
        const { numCopies, labelTemplate } = this.state;
        const sampleCount = this.getSampleCount();
        const model = this.getModel();

        let displayColumn = 'Name';
        let valueColumn = 'RowId';
        if (model?.queryInfo.pkCols?.first() === 'rowId') {
            displayColumn = 'name';
            valueColumn = 'rowId';
        }

        let message;
        if (sampleCount === 0) {
            message = 'Select samples to print labels for.';
        } else if (showSelection) {
            message = "Confirm you've selected the samples you want and the proper label template.";
        } else {
            message =
                'Choose the number of copies of the label for this sample to print and confirm the label template.';
        }

        return (
            <>
                <div className="bottom-spacing">{message}</div>
                <div>
                    <b>Number of copies</b>
                    <input
                        className="form-control label-printing--copies"
                        min={1}
                        name="numCopies"
                        onChange={this.onCopyCountChange}
                        type="number"
                        value={numCopies ? numCopies.toString() : undefined}
                    />
                    {showSelection && (
                        <div className="top-spacing">
                            <b>Selected samples to print</b>
                            <QuerySelect
                                formsy={false}
                                fireQSChangeOnInit={true}
                                showLabel={false}
                                loadOnFocus
                                maxRows={10}
                                multiple={true}
                                name="label-samples"
                                onQSChange={this.changeSampleSelection}
                                placeholder="Select or type to search..."
                                previewOptions={true}
                                required={false}
                                schemaQuery={model.schemaQuery}
                                queryFilters={List(model.filters)}
                                displayColumn={displayColumn}
                                valueColumn={valueColumn}
                                value={this.props.sampleIds.join(',')}
                            />
                        </div>
                    )}
                    <div className="top-spacing">
                        <b>
                            Label template
                            <LabelHelpTip title="BarTender Label Template">
                                <p>
                                    Provide the label template to use with BarTender. The path should be relative to the
                                    default folder configured in the BarTender web service.
                                </p>
                            </LabelHelpTip>
                        </b>
                        <input
                            className="form-control"
                            name="labelTemplate"
                            onChange={this.onLabelTemplateChange}
                            type="text"
                            value={labelTemplate}
                        />
                    </div>
                </div>
            </>
        );
    }

    render() {
        const { show, onCancel } = this.props;
        const { error, submitting } = this.state;
        const sampleModel = this.getModel();

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton={onCancel !== undefined}>
                    <Modal.Title>{this.getTitle()}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Alert>{error}</Alert>
                    {submitting ? (
                        <LoadingSpinner msg="Printing ..." />
                    ) : sampleModel && !sampleModel.isLoading ? (
                        this.renderForm()
                    ) : (
                        <LoadingSpinner />
                    )}
                </Modal.Body>

                <Modal.Footer>
                    {onCancel && (
                        <Button bsClass="btn btn-default pull-left" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <div className="pull-right">
                        <HelpLink topic={BAR_TENDER_TOPIC} className="label-printing--help-link">
                            BarTender help
                        </HelpLink>
                        <Button
                            bsClass="btn btn-success"
                            onClick={this.onConfirmPrint}
                            disabled={submitting || !this.isReadyForPrint()}
                        >
                            Yes, Print
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        );
    }
}

export const PrintLabelsModal = withQueryModels<PrintModalProps>(PrintLabelsModalImpl);
