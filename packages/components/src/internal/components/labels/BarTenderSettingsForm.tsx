import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import { Col, Panel, FormControl, Row, Button } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { HelpLink } from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { BarTenderConfiguration, BarTenderResponse } from './models';
import { withLabelPrintingContext, LabelPrintingProviderProps } from './LabelPrintingContextProvider';
import { BAR_TENDER_TOPIC, BARTENDER_CONFIGURATION_TITLE, LABEL_NOT_FOUND_ERROR } from './constants';
import { LabelsConfigurationPanel } from './LabelsConfigurationPanel';

interface OwnProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    onChange: () => void;
    onSuccess: () => void;
    title?: string;
}

interface State {
    btServiceURL: string;
    connectionValidated: boolean;
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

interface SaveButtonProps {
    dirty: boolean;
    onSave: () => void;
    submitting: boolean;
    testing: boolean;
}

const SaveButton: FC<SaveButtonProps> = memo(({ dirty, onSave, submitting, testing }) => (
    <Button
        className="pull-right alert-button"
        bsStyle="success"
        disabled={submitting || !dirty || testing}
        onClick={onSave}
    >
        Save
    </Button>
));

interface SettingsInputProps {
    description: string;
    label: string;
    name: string;
    onChange: (name: string, value: string) => void;
    type: 'text' | 'url';
    value: string;
}

const SettingsInput: FC<SettingsInputProps> = memo(({ children, description, label, name, onChange, type, value }) => {
    const onChange_ = useCallback(
        (event): void => {
            onChange(name, event.target.value);
        },
        [name, onChange]
    );

    return (
        <Row className="form-group">
            <Col xs={12}>
                {children}
                <div>
                    {label}{' '}
                    <LabelHelpTip title={label}>
                        <p>{description}</p>
                    </LabelHelpTip>
                </div>
            </Col>
            <Col xs={12}>
                <FormControl
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange_}
                    placeholder="BarTender Web Service URL"
                />
            </Col>
        </Row>
    );
});

// exported for jest testing
export class BarTenderSettingsFormImpl extends PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    private btTestConnectionTemplate = (label: string): string => {
        // Should be able to run connection test w/o a default label set.
        const formatNode = `<Format>${label}</Format>`;

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
                dirty: false,
                submitting: false,
            }));
        });
    };

    onChange = (name: string, value: string): void => {
        this.setState((state: State) => ({
            ...state,
            [name]: value,
            dirty: true,

            // Notifications are no longer applicable so clear them
            // checkFailure: false, //TODO Remove
            connectionValidated: undefined, // Value change has invalidated any existing validation
        }));

        this.props.onChange();
    };

    onSave = (): void => {
        this.setState(() => ({ submitting: true }));

        const { btServiceURL } = this.state;
        const config = new BarTenderConfiguration({ serviceURL: btServiceURL });

        this.props.api.labelprinting
            .saveBarTenderConfiguration(config)
            .then((btConfig: BarTenderConfiguration): void => {
                this.setState(() => ({
                    btServiceURL: btConfig.serviceURL,
                    dirty: false,
                    submitting: false,
                }));

                this.props.onSuccess();
            })
            .catch((reason: string) => {
                console.error(reason);
                this.setState(() => ({ submitting: false, saveErrorMsg: FAILED_TO_SAVE_MESSAGE }));
            });
    };

    onVerifyBarTenderConfiguration = (): void => {
        this.setState(() => ({ testing: true }));
        const { btServiceURL } = this.state;

        this.props.api.labelprinting
            .printBarTenderLabels(this.btTestConnectionTemplate(''), btServiceURL)
            .then((btResponse: BarTenderResponse) => {
                if (btResponse.ranToCompletion()) {
                    this.setState(() => ({ testing: false, connectionValidated: true, failureMessage: undefined }));
                } else if (btResponse.faulted()) {
                    this.onConnectionFailure(btResponse.getFaultMessage());
                } else {
                    this.onConnectionFailure(UNKNOWN_STATUS_MESSAGE);
                }
            })
            .catch(() => {
                this.onConnectionFailure(FAILED_NOTIFICATION_MESSAGE);
            });
    };

    onConnectionFailure = (message: string): void => {
        this.setState(() => ({ testing: false, connectionValidated: false, failureMessage: message }));
    };

    render(): ReactNode {
        const { title = BARTENDER_CONFIGURATION_TITLE } = this.props;
        const { btServiceURL, connectionValidated, dirty, failureMessage, submitting, testing } = this.state;
        const isBlank = !btServiceURL || btServiceURL.trim() === '';

        return (
            <Row>
                <Col xs={12}>
                    <Panel title={title}>
                        <Panel.Heading>{title}</Panel.Heading>
                        <Panel.Body>
                            {connectionValidated && (
                                <div>
                                    <Alert bsStyle="success">{SUCCESSFUL_NOTIFICATION_MESSAGE}</Alert>
                                </div>
                            )}
                            {connectionValidated === false && <Alert bsStyle="danger">{failureMessage}</Alert>}

                            <SettingsInput
                                description="URL of the BarTender service to use when printing labels."
                                label="BarTender Web Service URL"
                                name="btServiceURL"
                                onChange={this.onChange}
                                type="url"
                                value={btServiceURL}
                            >
                                <div className="pull-right">
                                    <HelpLink topic={BAR_TENDER_TOPIC} className="label-printing--help-link">
                                        Learn more about BarTender
                                    </HelpLink>
                                </div>
                            </SettingsInput>

                            <div className="bt-service-buttons">
                                <SaveButton
                                    dirty={dirty}
                                    onSave={this.onSave}
                                    submitting={submitting}
                                    testing={testing}
                                />

                                <Button
                                    className="button-right-spacing pull-right"
                                    bsStyle="default"
                                    disabled={isBlank}
                                    onClick={this.onVerifyBarTenderConfiguration}
                                >
                                    Test Connection
                                </Button>
                            </div>
                            <div className="label-templates-panel">
                                <LabelsConfigurationPanel {...this.props} />
                            </div>
                        </Panel.Body>
                    </Panel>
                </Col>
            </Row>
        );
    }
}

export const BarTenderSettingsForm = withLabelPrintingContext(BarTenderSettingsFormImpl);
