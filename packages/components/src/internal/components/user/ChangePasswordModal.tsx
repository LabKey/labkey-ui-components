import React from 'react';
import { Button, Col, Form, FormControl, Modal, Row } from 'react-bootstrap';

import { ChangePasswordModel } from './models';
import { changePassword, getPasswordRuleInfo } from './actions';
import {User} from "../base/models/User";
import {resolveErrorMessage} from "../../util/messaging";
import {LabelHelpTip} from "../base/LabelHelpTip";
import {Alert} from "../base/Alert";

interface Props {
    user: User;
    onSuccess: () => void;
    onHide: () => void;
}

interface State {
    model: ChangePasswordModel;
    passwordRule: string;
    submitting: boolean;
    error: string;
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

    onChange = (evt): void => {
        const name = evt.target.id;
        const value = evt.target.value;

        this.setState(state => ({
            model: state.model.set(name, value) as ChangePasswordModel,
        }));
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

    renderPasswordInput(name: string, value: string, label: string, description?: string) {
        return (
            <Row className="form-group">
                <Col xs={4}>
                    <div>
                        {label}{' '}
                        {description && (
                            <LabelHelpTip title={label}>
                                <p>{description}</p>
                            </LabelHelpTip>
                        )}
                    </div>
                </Col>
                <Col xs={8}>
                    <FormControl type="password" id={name} name={name} value={value} onChange={this.onChange} />
                </Col>
            </Row>
        );
    }

    render() {
        const { onHide } = this.props;
        const { model, submitting, error, passwordRule } = this.state;

        return (
            <Modal show={true} onHide={onHide}>
                <Modal.Header>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {this.renderPasswordInput('oldPassword', model.oldPassword, 'Old Password')}
                        {this.renderPasswordInput('password', model.password, 'New Password', passwordRule)}
                        {this.renderPasswordInput('password2', model.password2, 'Retype New Password')}
                    </Form>
                    {error && <Alert>{error}</Alert>}
                    <Row>
                        <Col xs={12}>
                            <Button onClick={onHide} className="pull-left">
                                Cancel
                            </Button>
                            <Button
                                className="pull-right"
                                bsStyle="success"
                                disabled={submitting}
                                onClick={this.submitChangePassword}
                            >
                                Submit
                            </Button>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        );
    }
}
