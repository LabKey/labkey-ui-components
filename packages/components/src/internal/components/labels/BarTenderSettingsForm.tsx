import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Panel, FormControl } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { HelpLink } from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { isAppHomeFolder } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { Container } from '../base/models/Container';

import { resolveErrorMessage } from '../../util/messaging';

import { BarTenderConfiguration } from './models';
import { BAR_TENDER_TOPIC, BARTENDER_CONFIGURATION_TITLE } from './constants';
import { LabelsConfigurationPanel } from './LabelsConfigurationPanel';

interface Props extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    container: Container;
    onChange: () => void;
    onSuccess: () => void;
    title?: string;
}

const SUCCESSFUL_NOTIFICATION_MESSAGE = 'Successfully connected to BarTender web service.';
const FAILED_NOTIFICATION_MESSAGE = 'Failed to connect to BarTender web service.';
const UNKNOWN_STATUS_MESSAGE = 'Unrecognized status code returned from BarTender service';
const FAILED_TO_SAVE_MESSAGE = 'Failed to save connection configuration';

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
        <div className="row form-group">
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
        </div>
    );
});

const btTestConnectionTemplate = (): string => {
    // This will fail script validation, but will have status "RanToCompletion" which means that the server was successfully
    // connected to. Issue #48014
    return `<XMLScript Version="2.0">
            <Command Name="Job1">
            </Command>
        </XMLScript>`;
};

// exported for jest testing
export const BarTenderSettingsForm: FC<Props> = memo(props => {
    const { api, container, title = BARTENDER_CONFIGURATION_TITLE, onChange, onSuccess } = props;
    const [btServiceURL, setBtServiceURL] = useState<string>();
    const [error, setError] = useState<string>();
    const [defaultLabel, setDefaultLabel] = useState<number>();
    const { moduleContext } = useServerContext();
    const [dirty, setDirty] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>();
    const [connectionValidated, setConnectionValidated] = useState<boolean>();
    const [failureMessage, setFailureMessage] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);
    const containerPath = container?.path;

    useEffect(() => {
        (async () => {
            try {
                const btConfiguration = await api.labelprinting.fetchBarTenderConfiguration(containerPath);
                setBtServiceURL(btConfiguration.serviceURL);
                setDefaultLabel(btConfiguration.defaultLabel);
                setError(undefined);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load BarTender configuration.');
            } finally {
                setLoading(false);
            }
        })();
    }, [api, containerPath]);

    const onChangeHandler = useCallback(
        (name: string, value: string): void => {
            setBtServiceURL(value);
            setDirty(true);
            setConnectionValidated(undefined);
            onChange?.();
        },
        [onChange]
    );

    const onSave = useCallback(async () => {
        setSubmitting(true);
        setFailureMessage(undefined); // Will update with new message if still needed.
        const config = new BarTenderConfiguration({ serviceURL: btServiceURL });

        try {
            const btConfig = await api.labelprinting.saveBarTenderURLConfiguration(config, containerPath);
            setBtServiceURL(btConfig.serviceURL);
            setDirty(false);
            onSuccess?.();
        } catch (e) {
            setFailureMessage(resolveErrorMessage(e) ?? FAILED_TO_SAVE_MESSAGE);
            setConnectionValidated(false);
        } finally {
            setSubmitting(false);
        }
    }, [api, btServiceURL, containerPath, onSuccess]);

    const onConnectionFailure = useCallback((message: string): void => {
        setTesting(false);
        setConnectionValidated(false);
        setFailureMessage(message);
    }, []);

    const onVerifyBarTenderConfiguration = useCallback((): void => {
        setTesting(true);

        api.labelprinting
            .printBarTenderLabels(btTestConnectionTemplate(), btServiceURL)
            .then(btResponse => {
                if (btResponse.ranToCompletion()) {
                    setTesting(false);
                    setConnectionValidated(true);
                    setFailureMessage(undefined);
                } else if (btResponse.faulted()) {
                    onConnectionFailure(btResponse.getFaultMessage());
                } else {
                    onConnectionFailure(UNKNOWN_STATUS_MESSAGE);
                }
            })
            .catch(() => {
                onConnectionFailure(FAILED_NOTIFICATION_MESSAGE);
            });
    }, [api, btServiceURL, onConnectionFailure]);

    return (
        <div className="row">
            <Col xs={12}>
                <Panel title={title}>
                    <Panel.Heading>{title}</Panel.Heading>
                    <Panel.Body>
                        {error && <Alert>{error}</Alert>}
                        {loading && <LoadingSpinner />}
                        {!loading && (
                            <>
                                {connectionValidated && (
                                    <div>
                                        <Alert bsStyle="success">{SUCCESSFUL_NOTIFICATION_MESSAGE}</Alert>
                                    </div>
                                )}
                                {connectionValidated === false && <Alert>{failureMessage}</Alert>}

                                <SettingsInput
                                    description="URL of the BarTender service to use when printing labels."
                                    label="BarTender Web Service URL"
                                    name="btServiceURL"
                                    onChange={onChangeHandler}
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
                                    <button
                                        className="pull-right alert-button btn btn-success"
                                        disabled={submitting || !dirty || testing}
                                        onClick={onSave}
                                        type="button"
                                    >
                                        Save
                                    </button>

                                    <button
                                        className="button-right-spacing pull-right btn btn-default"
                                        disabled={!btServiceURL || btServiceURL.trim() === ''}
                                        onClick={onVerifyBarTenderConfiguration}
                                        type="button"
                                    >
                                        Test Connection
                                    </button>
                                </div>
                                {isAppHomeFolder(container, moduleContext) && (
                                    <div className="label-templates-panel">
                                        <LabelsConfigurationPanel
                                            {...props}
                                            api={api}
                                            defaultLabel={defaultLabel}
                                            container={container}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </Panel.Body>
                </Panel>
            </Col>
        </div>
    );
});

BarTenderSettingsForm.defaultProps = {
    api: getDefaultAPIWrapper(),
};

BarTenderSettingsForm.displayName = 'BarTenderSettingsForm';
