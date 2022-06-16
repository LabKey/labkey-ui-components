import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';

import { ViewInfo } from '../../internal/ViewInfo';
import { SchemaQuery } from '../SchemaQuery';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { Alert } from '../../internal/components/base/Alert';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { useAppContext } from '../../internal/AppContext';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { deleteView, renameGridView, revertViewEdit, saveGridView, saveSessionView } from '../../internal/actions';

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
    const [newName, setNewName] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const [hasChange, setHasChange] = useState<boolean>();
    const [reselectViewName, setReselectViewName] = useState<string>(undefined);

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

    const revertDefaultView = useCallback(() => {
        handleAction(async () => {
            await revertViewEdit(schemaQuery, containerPath, '');
        });
    }, [schemaQuery, containerPath]);

    const setDefaultView = useCallback((view: ViewInfo) => {
            handleAction(async () => {
                const finalViewInfo = view.mutate({ name: '' });
                if (view.session)
                    await saveSessionView(schemaQuery, containerPath, view.name, '', view.inherit, true, true);
                else await saveGridView(schemaQuery, containerPath, finalViewInfo, true, false, view.inherit, true);
                await deleteView(schemaQuery, containerPath, view.name, false);
                if (currentView.name === view.name) setReselectViewName('');
            });
        },
        [schemaQuery, containerPath, currentView]
    );

    const deleteSavedView = useCallback(
        viewName => {
            handleAction(async () => {
                await deleteView(schemaQuery, containerPath, viewName, false);
                if (currentView.name === viewName) setReselectViewName('');
            });
        },
        [currentView, schemaQuery, containerPath]
    );

    const renameView = useCallback(async () => {
        if (!selectedView || !newName || !newName.trim()) {
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
    }, [selectedView, newName, currentView, schemaQuery, containerPath]);

    const onNewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setNewName(evt.target.value), []);

    return (
        <Modal onHide={onClose} show>
            <Modal.Header closeButton>
                <Modal.Title>Manage Saved Views</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                {!views && <LoadingSpinner />}
                {views &&
                    views.map(view => {
                        const unsavedView = view.session;
                        const isRenaming = !!selectedView;
                        const isDefault = view.isDefault;
                        let canEdit = !isDefault && !isRenaming && !unsavedView;
                        if (view.shared) canEdit = canEdit && user.isAdmin;

                        let viewLabel = view.isDefault ? 'Default View' : view.label;
                        if (unsavedView) viewLabel += ' (Edited)';

                        return (
                            <Row className="small-margin-bottom" key={view.name}>
                                <Col xs={7}>
                                    {selectedView && selectedView?.name === view.name ? (
                                        <input
                                            autoFocus
                                            placeholder={selectedView?.name}
                                            className="form-control"
                                            defaultValue={selectedView?.name}
                                            onBlur={renameView}
                                            onChange={onNewNameChange}
                                            type="text"
                                        />
                                    ) : (
                                        <span className="manage-view-name">{viewLabel}</span>
                                    )}
                                </Col>
                                <Col xs={2}>
                                    {user.hasAdminPermission() && (
                                        <>
                                            {isDefault && !isRenaming && (
                                                <span onClick={revertDefaultView} className="clickable-text">
                                                    Revert
                                                </span>
                                            )}
                                            {!isDefault && !isRenaming && (
                                                <span onClick={() => setDefaultView(view)} className="clickable-text">
                                                    Set default
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Col>
                                <Col xs={1}>
                                    {canEdit && (
                                        <span
                                            className="edit-inline-field__toggle"
                                            onClick={() => setSelectedView(view)}
                                        >
                                            <i className="fa fa-pencil" />
                                        </span>
                                    )}
                                </Col>
                                <Col xs={1}>
                                    {canEdit && (
                                        <span
                                            className="edit-inline-field__toggle"
                                            onClick={() => deleteSavedView(view.name)}
                                        >
                                            <i className="fa fa-trash-o" />
                                        </span>
                                    )}
                                </Col>
                            </Row>
                        );
                    })}
            </Modal.Body>
            <Modal.Footer>
                <button
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="btn btn-default pull-right"
                >
                    Done editing
                </button>
            </Modal.Footer>
        </Modal>
    );
});
