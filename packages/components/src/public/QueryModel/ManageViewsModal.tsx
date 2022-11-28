import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';

import { ViewInfo } from '../../internal/ViewInfo';
import { SchemaQuery } from '../SchemaQuery';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { Alert } from '../../internal/components/base/Alert';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { useAppContext } from '../../internal/AppContext';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { deleteView, renameGridView, revertViewEdit, saveGridView, saveSessionView } from '../../internal/actions';

import { ViewNameInput } from './SaveViewModal';

// exported for jest tests
export const ViewLabel: FC<{ view: ViewInfo }> = memo(props => {
    const { view } = props;
    const viewLabel = view.isDefault ? (view.saved && !view.shared ? 'My Default View' : 'Default View') : view.label;
    const modifiers = view.modifiers;
    if (modifiers.length > 0) {
        return (
            <>
                {viewLabel} <span className="text-muted">({modifiers.join(', ')})</span>
            </>
        );
    }
    return <>{viewLabel}</>;
});

export interface Props {
    containerPath?: string;
    currentView: ViewInfo;
    onDone: (hasChange: boolean, reselectViewName: string) => void;
    schemaQuery: SchemaQuery;
}

export const ManageViewsModal: FC<Props> = memo(props => {
    const { onDone, schemaQuery, currentView, containerPath } = props;

    const [views, setViews] = useState<ViewInfo[]>(undefined);
    const [selectedView, setSelectedView] = useState<ViewInfo>(undefined);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const [hasChange, setHasChange] = useState<boolean>();
    const [reselectViewName, setReselectViewName] = useState<string>(undefined);
    const [deleting, setDeleting] = useState<ViewInfo>(undefined);

    const { api } = useAppContext();

    const { user } = useServerContext();

    useEffect(() => {
        (async () => {
            try {
                setViews(await api.query.getGridViews(schemaQuery, true));
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            }
        })();
    }, []);

    const onClose = useCallback(() => {
        onDone(hasChange, reselectViewName);
    }, [hasChange, reselectViewName, onDone]);

    const handleAction = useCallback(
        async (_handle: () => void) => {
            setErrorMessage(undefined);
            setDeleting(undefined);
            setIsSubmitting(true);
            setHasChange(true);

            try {
                await _handle();
                setViews(await api.query.getGridViews(schemaQuery, true));
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [schemaQuery]
    );

    const getActionView = useCallback(
        event => {
            const targetId = event.target.id;
            const viewInd = parseInt(targetId.split('-')[1]);
            return views[viewInd];
        },
        [views]
    );

    const onSelectView = useCallback(
        event => {
            const view = getActionView(event);
            setSelectedView(view);
        },
        [getActionView]
    );

    const revertDefaultView = useCallback(() => {
        handleAction(async () => {
            await revertViewEdit(schemaQuery, containerPath, '');
        });
    }, [schemaQuery, containerPath]);

    const setDefaultView = useCallback(
        event => {
            const view = getActionView(event);
            handleAction(async () => {
                const finalViewInfo = view.mutate({ name: '' });
                if (view.session) {
                    await saveSessionView(schemaQuery, containerPath, view.name, '', view.inherit, true, true);
                } else {
                    await saveGridView(schemaQuery, containerPath, finalViewInfo, true, false, view.inherit, true);
                }
                if (currentView.name === view.name) setReselectViewName('');
            });
        },
        [schemaQuery, containerPath, currentView, getActionView]
    );

    const deleteSavedView = useCallback(() => {
        handleAction(async () => {
            const viewName = deleting.name;
            await deleteView(schemaQuery, containerPath, viewName, false);
            if (currentView.name === viewName || reselectViewName === viewName) setReselectViewName('');
        });
    }, [currentView, deleting, schemaQuery, containerPath, reselectViewName]);

    const onDeleteView = useCallback(
        event => {
            setDeleting(getActionView(event));
        },
        [getActionView]
    );

    const cancelDeleteView = useCallback(event => {
        setDeleting(undefined);
    }, []);

    const renameView = useCallback(
        async (newName: string, hasError: boolean) => {
            if (!selectedView || !newName || !newName.trim() || hasError) {
                setSelectedView(undefined);
                return;
            }

            if (selectedView.name.toLowerCase() === newName.toLowerCase()) {
                setSelectedView(undefined);
                return;
            }

            await handleAction(async () => {
                await renameGridView(schemaQuery, containerPath, selectedView.name, newName);
                setSelectedView(undefined);
                if (selectedView.name === currentView.name) setReselectViewName(newName);
            });
        },
        [selectedView, currentView, schemaQuery, containerPath]
    );

    return (
        <Modal onHide={onClose} show>
            <Modal.Header closeButton>
                <Modal.Title>Manage Saved Views</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                {!views && !errorMessage && <LoadingSpinner />}
                {views &&
                    views.map((view, ind) => {
                        const { isDefault, isSystemView, shared } = view;
                        const unsavedView = view.session;
                        const isRenaming = !!selectedView;
                        let canEdit = !isDefault && !isRenaming && !unsavedView && !deleting;
                        if (shared) canEdit = canEdit && user.isAdmin;

                        let revert = <span className="gray-text">Revert</span>;
                        if (view.isSaved) {
                            revert = (
                                <span onClick={revertDefaultView} className="clickable-text">
                                    Revert
                                </span>
                            );
                        }

                        // other than the default view, don't show system views
                        if (!isDefault && isSystemView) return null;

                        return (
                            <>
                                <Row className="small-margin-bottom" key={view.name}>
                                    <Col xs={8}>
                                        {selectedView && selectedView?.name === view.name ? (
                                            <ViewNameInput
                                                autoFocus={true}
                                                view={selectedView}
                                                onBlur={renameView}
                                                placeholder={selectedView?.name}
                                                defaultValue={selectedView?.name}
                                            />
                                        ) : (
                                            <ViewLabel view={view} />
                                        )}
                                    </Col>
                                    <Col xs={4}>
                                        {user.hasAdminPermission() && (
                                            <>
                                                {isDefault && !isRenaming && (
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Popover id="disabled-button-popover">
                                                                Revert back to the system default view.
                                                            </Popover>
                                                        }
                                                    >
                                                        {revert}
                                                    </OverlayTrigger>
                                                )}
                                                {!isDefault && !isRenaming && (
                                                    <span
                                                        onClick={setDefaultView}
                                                        id={'setDefault-' + ind}
                                                        className="clickable-text"
                                                    >
                                                        Make default
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {canEdit && (
                                            <span className="pull-right">
                                                <span
                                                    className="edit-inline-field__toggle small-right-spacing"
                                                    onClick={onSelectView}
                                                >
                                                    <i id={'select-' + ind} className="fa fa-pencil" />
                                                </span>
                                                <span className="edit-inline-field__toggle" onClick={onDeleteView}>
                                                    <i id={'delete-' + ind} className="fa fa-trash-o" />
                                                </span>
                                            </span>
                                        )}
                                    </Col>
                                </Row>
                                {deleting === view && (
                                    <Row className="bottom-spacing">
                                        <Col xs={12}>
                                            <div className="inline-confirmation">
                                                <div>
                                                    <span className="inline-confirmation__label">
                                                        Permanently remove this view?
                                                    </span>
                                                    <button
                                                        className="button-left-spacing alert-button btn btn-danger"
                                                        id={'confirm-delete-' + ind}
                                                        onClick={deleteSavedView}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        className="button-left-spacing alert-button btn btn-default"
                                                        id={'cancel-delete-' + ind}
                                                        onClick={cancelDeleteView}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </>
                        );
                    })}
            </Modal.Body>
            <Modal.Footer>
                <button disabled={isSubmitting} onClick={onClose} className="btn btn-default pull-right">
                    Done
                </button>
            </Modal.Footer>
        </Modal>
    );
});
