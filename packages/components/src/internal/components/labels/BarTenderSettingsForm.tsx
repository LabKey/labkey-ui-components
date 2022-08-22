import React from 'react';
import { Col, Panel, FormControl, Row, Button } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { HelpLink } from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { BarTenderConfiguration, BarTenderResponse } from './models';
import { saveBarTenderConfiguration, printBarTenderLabels } from './actions';
import { withLabelPrintingContext, LabelPrintingProviderProps } from './LabelPrintingContextProvider';
import { BAR_TENDER_TOPIC, BARTENDER_CONFIGURATION_TITLE, LABEL_NOT_FOUND_ERROR } from './constants';

interface OwnProps {
    api?: ComponentsAPIWrapper;
    onChange: () => void;
    onConfigFailure?: () => any;
    onConfigSuccess?: () => any;
    onSuccess: () => void;
    title?: string;
    titleCls?: string;
}

interface State {
    btServiceURL: string;
    connectionValidated: boolean;
    defaultLabel: string;
    dirty: boolean;
    failureMessage: string;
    saveErrorMsg: string;
    submitting: boolean;
    testing: boolean;
}

// type Props = CommonStateProps & LabelPrintingProviderProps & OwnProps;
type Props = LabelPrintingProviderProps & OwnProps;

const SUCCESSFUL_NOTIFICATION_MESSAGE = 'Successfully connected to BarTender web service.';
const FAILED_NOTIFICATION_MESSAGE = 'Failed to connect to BarTender web service.';
const UNKNOWN_STATUS_MESSAGE = 'Unrecognized status code returned from BarTender service';
const FAILED_TO_SAVE_MESSAGE = 'Failed to save connection configuration';

// exported for jest testing
export class BarTenderSettingsFormImpl extends React.PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    private btTestConnectionTemplate = (label: string): string => {
        // Should be able to run connection test w/o a default label set.
        const formatNode = label ? `<Format>${label}</Format>` : '';

        return `<XMLScript Version="2.0">
            <Command Name="Job1">
                <FormatSetup>
                    ${formatNode}
                </FormatSetup>
            </Command>
        </XMLScript>`;
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            btServiceURL: undefined,
            defaultLabel: undefined,
            dirty: false,
            submitting: false,
            testing: false,
            saveErrorMsg: undefined,
            connectionValidated: undefined, // Don't know if it has been verified
            failureMessage: undefined,
        };
    }

    componentDidMount(): void {
        this.load();
    }

    load = (): void => {
        this.props.api.labelprinting.fetchBarTenderConfiguration().then(btConfiguration => {
            this.setState(() => ({
                btServiceURL: btConfiguration.serviceURL,
                defaultLabel: btConfiguration.defaultLabel,
                dirty: false,
                submitting: false,
            }));
        });
    };

    onChange = evt => {
        const name = evt.target.id;
        const value = evt.target.value;

        this.setState((state: State) => ({
            ...state,
            [name]: value,
            dirty: true,

            // Notifications are no longer applicable so clear them
            // checkFailure: false, //TODO Remove
            connectionValidated: undefined, // Value change has invalidated any existing validation
        }));

        const { onChange } = this.props;
        if (onChange) onChange();
    };

    onSave = () => {
        this.setState(() => ({ submitting: true }));

        const { btServiceURL, defaultLabel } = this.state;
        const config = new BarTenderConfiguration({ serviceURL: btServiceURL, defaultLabel });

        saveBarTenderConfiguration(config)
            .then((btConfig: BarTenderConfiguration): void => {
                const { onSuccess } = this.props;

                this.setState(() => ({
                    btServiceURL: btConfig.serviceURL,
                    defaultLabel: btConfig.defaultLabel,
                    dirty: false,
                    submitting: false,
                }));

                if (onSuccess) {
                    onSuccess();
                }
            })
            .catch((reason: string) => {
                console.error(reason);
                this.setState(() => ({ submitting: false, saveErrorMsg: FAILED_TO_SAVE_MESSAGE }));
            });
    };

    onVerifyBarTenderConfiguration = () => {
        this.setState(() => ({ testing: true }));
        const { btServiceURL, defaultLabel } = this.state;

        printBarTenderLabels(this.btTestConnectionTemplate(defaultLabel), btServiceURL)
            .then((btResponse: BarTenderResponse) => {
                if (btResponse.ranToCompletion()) {
                    this.onConnectionSuccess();
                } else if (btResponse.faulted()) {
                    if (btResponse.isLabelUnavailableError(defaultLabel))
                        this.onConnectionFailure(LABEL_NOT_FOUND_ERROR);
                    else this.onConnectionFailure(btResponse.getFaultMessage());
                } else {
                    this.onConnectionFailure(UNKNOWN_STATUS_MESSAGE);
                }
            })
            .catch(() => {
                this.onConnectionFailure(FAILED_NOTIFICATION_MESSAGE);
            });
    };

    onConnectionSuccess = () => {
        const { onConfigSuccess } = this.props;

        this.setState(() => ({ testing: false, connectionValidated: true, failureMessage: undefined }));
        if (onConfigSuccess) {
            onConfigSuccess();
        }
    };

    onConnectionFailure = (message: string) => {
        const { onConfigFailure } = this.props;

        this.setState(() => ({ testing: false, connectionValidated: false, failureMessage: message }));
        if (onConfigFailure) {
            onConfigFailure();
        }
    };

    renderTestConfigButton = (): React.ReactNode => {
        const { btServiceURL } = this.state;
        const isBlank = !btServiceURL || btServiceURL.trim() === '';

        return (
            <Button
                className="button-right-spacing pull-right"
                bsStyle="default"
                disabled={isBlank}
                onClick={this.onVerifyBarTenderConfiguration}
            >
                Test Connection
            </Button>
        );
    };

    renderSaveButton = (): React.ReactNode => {
        const { submitting, dirty, testing } = this.state;

        return (
            <Button
                className="pull-right alert-button"
                bsStyle="success"
                disabled={submitting || !dirty || testing}
                onClick={this.onSave}
            >
                Save
            </Button>
        );
    };

    renderURLInput = () => {
        const label = 'BarTender Web Service URL';
        const description = 'URL of the BarTender service to use when printing labels.';
        const name = 'btServiceURL';
        const { btServiceURL } = this.state;

        return (
            <Row className="form-group">
                <Col xs={12}>
                    <div className="pull-right">
                        <HelpLink topic={BAR_TENDER_TOPIC} className="label-printing--help-link">
                            Learn more about BarTender
                        </HelpLink>
                    </div>
                    <div>
                        {label}{' '}
                        {description && (
                            <LabelHelpTip title={label}>
                                <p>{description}</p>
                            </LabelHelpTip>
                        )}
                    </div>
                </Col>
                <Col xs={12}>
                    <FormControl
                        type="url"
                        id={name}
                        name={name}
                        value={btServiceURL}
                        onChange={this.onChange}
                        placeholder="BarTender Web Service URL"
                    />
                </Col>
            </Row>
        );
    };

    renderLabelInput = () => {
        const label = 'Label Template File';
        const description =
            'Default Label file to use when printing labels with BarTender. The path should be relative to the default folder configured for the BarTender web service.';
        const name = 'defaultLabel';
        const { defaultLabel } = this.state;

        return (
            <Row className="form-group">
                <Col xs={12}>
                    <div>
                        {label}{' '}
                        {description && (
                            <LabelHelpTip title={label}>
                                <p>{description}</p>
                            </LabelHelpTip>
                        )}
                    </div>
                </Col>
                <Col xs={12}>
                    <FormControl
                        type="text"
                        id={name}
                        name={name}
                        value={defaultLabel}
                        onChange={this.onChange}
                        placeholder="Default Label File"
                    />
                </Col>
            </Row>
        );
    };

    render(): React.ReactNode {
        const { title = BARTENDER_CONFIGURATION_TITLE, titleCls } = this.props;
        const { dirty, connectionValidated } = this.state;

        return (
            <Row>
                <Col xs={12}>
                    <Panel title={title}>
                        {!titleCls && <Panel.Heading>{title}</Panel.Heading>}
                        <Panel.Body>
                            {titleCls && <h4 className={titleCls}>{title}</h4>}
                            {dirty && (
                                <div className="permissions-save-alert">
                                    <Alert bsStyle="info">
                                        You have unsaved changes.
                                        {this.renderSaveButton()}
                                    </Alert>
                                </div>
                            )}
                            {connectionValidated && BarTenderSettingsFormImpl.renderConnectionValidated()}
                            {connectionValidated === false && this.renderConnectionFailedValidation()}
                            {this.renderURLInput()}
                            {this.renderLabelInput()}
                            {this.renderButtons()}
                        </Panel.Body>
                    </Panel>
                </Col>
            </Row>
        );
    }

    private static renderConnectionValidated(): React.ReactNode {
        return (
            <div>
                <Alert bsStyle="success">{SUCCESSFUL_NOTIFICATION_MESSAGE}</Alert>
            </div>
        );
    }

    private renderConnectionFailedValidation(): React.ReactNode {
        const { failureMessage } = this.state;
        return <Alert bsStyle="danger">{failureMessage}</Alert>;
    }

    private renderButtons() {
        return (
            <div>
                {this.renderSaveButton()}
                {this.renderTestConfigButton()}
            </div>
        );
    }
}

export const BarTenderSettingsForm = withLabelPrintingContext(BarTenderSettingsFormImpl);
