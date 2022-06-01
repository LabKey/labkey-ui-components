import React, { ChangeEvent, FC, memo, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';

import {PermissionTypes} from "@labkey/api";

import { WizardNavButtons } from '../../internal/components/buttons/WizardNavButtons';
import { ViewInfo } from "../../internal/ViewInfo";
import { Alert } from "../../internal/components/base/Alert";
import {resolveErrorMessage} from "../../internal/util/messaging";
import {CUSTOM_VIEW,HelpLink} from "../../internal/util/helpLinks";
import {RequiresPermission} from "../../internal/components/base/Permissions";
import {isSubfolderDataEnabled} from "../../internal/app/utils";

export interface Props {
    currentView: ViewInfo;
    onCancel: () => void;
    onConfirmSave?: (viewName, canInherit, replace) => Promise<any>;
    afterSave?: (viewName: string) => void;
    viewLabel?: string;
}

export const SaveViewModal: FC<Props> = memo(props => {
    const { onConfirmSave, currentView, onCancel, afterSave, viewLabel } = props;

    const [viewName, setViewName] = useState<string>(currentView?.name);
    const [isDefaultView, setIsDefaultView] = useState<boolean>();
    const [canInherit, setCanInherit] = useState<boolean>();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();

    const saveView = useCallback(async () => {
        if (!viewName && !isDefaultView) return;

        setErrorMessage(undefined);
        setIsSubmitting(true);

        try {
            const isCurrentView = viewName?.toLowerCase() === currentView?.name?.toLowerCase();
            const name = isDefaultView ? '' : viewName;
            await onConfirmSave(name, canInherit, isCurrentView);
            afterSave(name);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [viewName]);

    const onViewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setViewName(evt.target.value), []);

    const toggleDefaultView = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setIsDefaultView(evt.target.checked)
    }, []);

    const toggleInherit = useCallback((evt: ChangeEvent<HTMLInputElement>) => setCanInherit(evt.target.checked), []);

    return (
        <Modal onHide={onCancel} show>
            <Modal.Header closeButton>
                <Modal.Title>Save Grid View</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                <form onSubmit={saveView}>
                    <div className="form-group">
                        <div className="bottom-spacing">
                            Sort order and filters are not saved as part of custom grid views. Once saved, this view will be available on {viewLabel ?? currentView.name} grids throughout the application.
                            Learn more about <HelpLink topic={CUSTOM_VIEW}>custom grid views</HelpLink> in LabKey.
                        </div>
                        <div className="bottom-spacing">
                            <input
                                placeholder="Give this search a name"
                                className="form-control"
                                value={viewName}
                                onChange={onViewNameChange}
                                disabled={isDefaultView}
                                type="text"
                            />
                        </div>
                        <RequiresPermission perms={PermissionTypes.Admin}>
                            <div className="form-check bottom-spacing">
                                <input className="form-check-input" type="checkbox" id="setDefaultView" onChange={toggleDefaultView} checked={isDefaultView}/>
                                <span className="margin-left">Make this the default grid view</span>
                            </div>
                        </RequiresPermission>
                        {isSubfolderDataEnabled() &&
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="setInherit" onChange={toggleInherit} checked={canInherit}/>
                                <span className="margin-left">Make this grid view available in child folders</span>
                            </div>
                        }
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <WizardNavButtons
                    cancel={onCancel}
                    cancelText="Cancel"
                    canFinish={!!viewName || isDefaultView}
                    containerClassName=""
                    isFinishing={isSubmitting}
                    isFinishingText="Saving..."
                    finish
                    finishText="Save"
                    nextStep={saveView}
                />
            </Modal.Footer>
        </Modal>
    );
});
