import React, { FC, useCallback } from 'react';
import { Col, Form, FormControl, Row } from 'react-bootstrap';

import { Modal } from '../../Modal';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Alert } from '../base/Alert';

import { changePassword, getPasswordRuleInfo } from './actions';
import { ChangePasswordModel } from './models';

interface PasswordInputProps {
    helpTip?: string;
    label: string;
    name: string;
    onChange: (name: string, value: string) => void;
    value: string;
}

const PasswordInput: FC<PasswordInputProps> = ({ helpTip, label, name, onChange, value }) => {
    const onChange_ = useCallback(event => onChange(event.target.name, event.target.value), [onChange]);
    return (
        <div className="form-group row">
            <div className="col-xs-4">
                <label className="control-label" htmlFor={name}>
                    {label}
                    {helpTip && (
                        <LabelHelpTip title={label}>
                            <p>{helpTip}</p>
                        </LabelHelpTip>
                    )}
                </label>
            </div>
            <div className="col-xs-8">
                <input
                    className="form-control"
                    type="password"
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange_}
                />
            </div>
        </div>
    );
};

interface Props {
    onHide: () => void; // TODO: rename
    onSuccess: () => void;
    user: User;
}

interface State {
    error: string;
    model: ChangePasswordModel;
    passwordRule: string;
    submitting: boolean;
}

export class ChangePasswordModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            model: new ChangePasswordModel({
                email: props.user.email,
            }),
            passwordRule: undefined,
            submitting: false,
            error: undefined,
        };
    }

    componentDidMount(): void {
        getPasswordRuleInfo()
            .then(response => {
                this.setState(() => ({ passwordRule: response.summary }));
            })
            .catch(response => {
                this.setState({ error: resolveErrorMessage(response) });
            });
    }

    onChange = (name, value): void => {
        this.setState(state => ({ model: state.model.set(name, value) as ChangePasswordModel }));
    };

    submitChangePassword = (): void => {
        this.setState({ submitting: true });

        changePassword(this.state.model)
            .then(() => {
                this.props.onHide();
                this.props.onSuccess();
                this.setState({ submitting: false });
            })
            .catch(response => {
                this.setState({ error: resolveErrorMessage(response), submitting: false });
            });
    };

    render() {
        const { onHide } = this.props;
        const { model, submitting, error, passwordRule } = this.state;

        return (
            <Modal
                isConfirming={submitting}
                onCancel={onHide}
                onConfirm={this.submitChangePassword}
                titleText="Change Password"
            >
                <form>
                    <PasswordInput
                        label="Old Password"
                        name="oldPassword"
                        onChange={this.onChange}
                        value={model.oldPassword}
                    />
                    <PasswordInput
                        label="New Password"
                        name="password"
                        onChange={this.onChange}
                        value={model.password}
                        helpTip={passwordRule}
                    />
                    <PasswordInput
                        label="Retype New Password"
                        name="password2"
                        onChange={this.onChange}
                        value={model.password2}
                    />
                </form>
                {error && <Alert>{error}</Alert>}
            </Modal>
        );
    }
}
