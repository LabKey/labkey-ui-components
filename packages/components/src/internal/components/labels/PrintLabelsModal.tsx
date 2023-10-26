import React, { PureComponent } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { List } from 'immutable';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { HelpLink } from '../../util/helpLinks';
import { QuerySelect } from '../forms/QuerySelect';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { BarTenderResponse } from './models';
import { BAR_TENDER_TOPIC, LABEL_NOT_FOUND_ERROR, LABEL_TEMPLATE_SQ } from './constants';

export interface PrintModalProps {
    afterPrint?: (numSamples: number, numLabels: number) => void;
    api?: ComponentsAPIWrapper;
    defaultLabel: number;
    model: QueryModel;
    onCancel?: (any) => void;
    printServiceUrl: string;
    sampleIds: string[];
    show: boolean;
    showSelection: boolean;
}

interface State {
    error: any;
    labelTemplate: number;
    loadingSelections: boolean;
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
            error: undefined,
            labelTemplate: props.defaultLabel,
            loadingSelections: true,
            numCopies: 1,
            sampleCount: props.sampleIds.length,
            submitting: false,
        };
    }

    componentDidMount() {
        const { model } = this.props;

        this.props.actions.addModel(
            {
                id: this._modelId,
                schemaQuery: model?.schemaQuery,
                baseFilters: model?.filters,
                sorts: model?.sorts,
            },
            true,
            true
        );
    }

    componentDidUpdate(prevProps, prevState) {
        // only set initial model selections once after the loadingSelections state changes to LOADED
        if (this.state.loadingSelections && !this.getModel().isLoadingSelections) {
            this.setState(() => ({ loadingSelections: false }));
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

    onConfirmPrint = (): void => {
        this.setState(() => ({ error: undefined, submitting: true }));
        const { labelTemplate } = this.state;
        this.props.api.labelprinting
            .printGridLabels(this.getModel(), '' + labelTemplate, this.state.numCopies, this.props.printServiceUrl)
            .then((btResponse: BarTenderResponse): void => {
                if (btResponse.ranToCompletion()) {
                    this.onLabelPrintSuccess();
                } else if (btResponse.faulted() && btResponse.isLabelUnavailableError()) {
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

    changeTemplateSelection = (name: string, value: number): void => {
        this.setState(() => ({ labelTemplate: value }));
    };

    isReadyForPrint(): boolean {
        const { labelTemplate, numCopies } = this.state;
        return (
            labelTemplate !== undefined &&
            labelTemplate >= 0 &&
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
        if (model?.queryInfo.pkCols?.[0] === 'rowId') {
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
                        <b>Label template</b>
                        <QuerySelect
                            formsy={false}
                            fireQSChangeOnInit={true}
                            showLabel={false}
                            loadOnFocus
                            maxRows={10}
                            name="label-template"
                            onQSChange={this.changeTemplateSelection}
                            placeholder="Select or type to search..."
                            required={true}
                            schemaQuery={LABEL_TEMPLATE_SQ}
                            displayColumn="name"
                            valueColumn="rowId"
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
                    <h4 className="modal-title">{this.getTitle()}</h4>
                </Modal.Header>

                <div className="modal-body">
                    <Alert>{error}</Alert>
                    {submitting ? (
                        <LoadingSpinner msg="Printing ..." />
                    ) : sampleModel && !sampleModel.isLoading ? (
                        this.renderForm()
                    ) : (
                        <LoadingSpinner />
                    )}
                </div>

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
