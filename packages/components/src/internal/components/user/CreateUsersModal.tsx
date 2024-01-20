import React, { ReactNode } from 'react';
import { FormControl, Modal } from 'react-bootstrap';
import { Security } from '@labkey/api';
import { ModalButtons } from '../../ModalButtons';

import { UserLimitSettings } from '../permissions/actions';
import { SelectInput } from '../forms/input/SelectInput';
import { Alert } from '../base/Alert';

interface Props {
    onCancel: () => void;
    onComplete: (response: any, roles: string[]) => void;
    show: boolean;
    userLimitSettings?: Partial<UserLimitSettings>;

    // optional array of role options, objects with id and label values (i.e. [{id: "org.labkey.api.security.roles.ReaderRole", label: "Reader (default)"}])
    // note that the createNewUser action will not use this value but it will be passed back to the onComplete
    roleOptions?: any[];
}

interface State {
    emailText: string;
    error: string;
    isSubmitting: boolean;
    optionalMessage: string;
    roles: string[];
}

const DEFAULT_STATE = {
    emailText: '',
    optionalMessage: '',
    roles: undefined,
    isSubmitting: false,
    error: undefined,
};

export class CreateUsersModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = DEFAULT_STATE;
    }

    handleEmail = (evt: any): void => {
        const emailText = evt.target.value;
        this.setState(() => ({ emailText }));
    };

    handleOptionalMessage = (evt: any): void => {
        const optionalMessage = evt.target.value;
        this.setState(() => ({ optionalMessage }));
    };

    handleRoles = (name, formValue, selectedOptions: Array<{ id: string; label: string }>): void => {
        const roles = selectedOptions ? selectedOptions.map(option => option.id) : undefined;
        this.setState({ roles });
    };

    createUsers = (): void => {
        const { emailText, optionalMessage } = this.state;
        this.setState(() => ({ isSubmitting: true, error: undefined }));

        // convert the email addresses from newline separated to semicolon separated
        const email = emailText.replace(/\n/g, ';');

        Security.createNewUser({
            email,
            sendEmail: true,
            optionalMessage: optionalMessage && optionalMessage.length > 0 ? optionalMessage : undefined,
            success: response => {
                this.props.onComplete(response, this.getSelectedRoles());
                this.setState(() => DEFAULT_STATE);
            },
            failure: error => {
                console.error(error);
                this.setState(() => ({ isSubmitting: false, error: error.exception }));
            },
        });
    };

    hasRoleOptions(): boolean {
        return this.props.roleOptions && this.props.roleOptions.length > 0;
    }

    getSelectedRoles(): string[] {
        return this.hasRoleOptions() ? this.state.roles || [this.props.roleOptions[0].id] : undefined;
    }

    renderForm(): ReactNode {
        const { userLimitSettings } = this.props;
        const { emailText, optionalMessage } = this.state;

        return (
            <>
                <div className="create-users-label-bottom">
                    Enter one or more email addresses, each on its own line:
                </div>
                <FormControl
                    componentClass="textarea"
                    className="form-control"
                    id="create-users-email-input"
                    rows={5}
                    value={emailText || ''}
                    onChange={this.handleEmail}
                />
                {userLimitSettings?.userLimit && (
                    <div className="create-users-limit-message">
                        Number of users that can be added: {userLimitSettings.remainingUsers}
                    </div>
                )}
                {this.hasRoleOptions() && (
                    <>
                        <div className="create-users-label-top create-users-label-bottom">Roles:</div>
                        <SelectInput
                            containerClass="form-group row"
                            inputClass="col-sm-12"
                            name="create-users-role"
                            key="create-users-role-selection"
                            placeholder="Select role..."
                            value={this.getSelectedRoles()}
                            options={this.props.roleOptions}
                            valueKey="id"
                            onChange={this.handleRoles}
                            clearable={false}
                            required
                            multiple
                        />
                    </>
                )}
                <div className="create-users-label-bottom">Optional message to send to new users:</div>
                <FormControl
                    componentClass="textarea"
                    className="form-control"
                    id="create-users-optionalMessage-input"
                    rows={5}
                    value={optionalMessage || ''}
                    placeholder="Add your message to be included in the invite email..."
                    onChange={this.handleOptionalMessage}
                />
            </>
        );
    }

    render(): ReactNode {
        const { show, onCancel } = this.props;
        const { error, emailText } = this.state;
        const valid = emailText?.length > 0 && this.getSelectedRoles()?.length > 0; // Issue 46841

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Users</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.renderForm()}
                    {error && <Alert style={{ marginTop: '10px' }}>{error}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <ModalButtons
                        canConfirm={valid}
                        confirmText="Create Users"
                        confirmingText="Creating Users..."
                        isConfirming={this.state.isSubmitting}
                        onCancel={this.props.onCancel}
                        onConfirm={this.createUsers}
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}
