import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';
import { ViewInfo } from "../../internal/ViewInfo";
import { SchemaQuery } from "../SchemaQuery";
import {LoadingSpinner} from "../../internal/components/base/LoadingSpinner";
import {Alert} from "../../internal/components/base/Alert";
import {useServerContext} from "../../internal/components/base/ServerContext";
import {useAppContext} from "../../internal/AppContext";
import {resolveErrorMessage} from "../../internal/util/messaging";
import {deleteView, revertViewEdit, saveGridView} from "../../internal/actions";

export interface Props {
    onDone: (hasChange?: boolean, selectDefaultView?: boolean) => void;
    currentView: ViewInfo;
    schemaQuery: SchemaQuery;
}

export const ManageViewsModal: FC<Props> = memo(props => {
    const { onDone, schemaQuery, currentView } = props;

    const [views, setViews] = useState<ViewInfo[]>(undefined);
    const [selectedView, setSelectedView] = useState<ViewInfo>(undefined);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [newName, setNewName] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const [hasChange, setHasChange] = useState<boolean>();
    const [selectDefaultView, setSelectDefaultView] = useState<boolean>(false);

    const { api } = useAppContext();

    const { user } = useServerContext();

    useEffect(() => {
        (async () => {
            try {
                setViews(await api.query.getGridViews(schemaQuery));
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            }
        })();
    }, []);

    const handleAction = useCallback(async (_handle: () => any) => {
        setErrorMessage(undefined);
        setIsSubmitting(true);
        setHasChange(true);

        try {
            await _handle();
            setViews(await api.query.getGridViews(schemaQuery));
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [schemaQuery]);

    const revertDefaultView = useCallback(async () => {
        await handleAction(async () => {
            await revertViewEdit(schemaQuery, undefined, '');
        });
    }, [schemaQuery]);

    const setDefaultView = useCallback(async (view: ViewInfo) => {
        await handleAction(async () => {
            await saveGridView(schemaQuery, view.columns, undefined, '', false, false, view.inherit, true, true);

        });

    }, [schemaQuery]);

    const deleteSavedView = useCallback(async viewName => {
        await handleAction(async () => {
            await deleteView(schemaQuery, undefined, viewName, false);
            if (currentView.name === viewName)
                setSelectDefaultView(true);
        });

    }, [currentView, schemaQuery]);

    const renameView = useCallback(async () => {
        if (!selectedView || !newName) {
            setSelectedView(undefined);
            return;
        }

        if (selectedView.name.toLowerCase() === newName.toLowerCase()) {
            setSelectedView(undefined);
            return;
        }

        await handleAction(async () => {
            // await renameReport(selectedSearch.entityId, newName);

            setSelectedView(undefined);
            if (selectedView.name === currentView.name)
                setSelectDefaultView(true);
        });

    }, [selectedView, newName, currentView, schemaQuery]);

    const onNewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setNewName(evt.target.value), []);

    return (
        <Modal onHide={() => onDone(hasChange, selectDefaultView)} show>
            <Modal.Header closeButton>
                <Modal.Title>Manage Saved Views</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                {!views && <LoadingSpinner />}
                {views &&
                    views.map(view => {
                        const isDefault = view.isDefault;
                        return (
                            <Row className="small-margin-bottom">
                                <Col xs={5}>
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
                                        view.isDefault ? 'Default View' : view.label
                                    )}
                                </Col>
                                <Col xs={3}>
                                    {
                                        user.hasAdminPermission() && (
                                            <>
                                                {isDefault && !selectedView &&
                                                    <span onClick={revertDefaultView} className="clickable-text">
                                                        Revert
                                                     </span>
                                                }
                                                {!isDefault && !selectedView &&
                                                    <span onClick={() => setDefaultView(view)} className="clickable-text">
                                                        Make default
                                                     </span>
                                                }
                                            </>
                                        )
                                    }
                                </Col>
                                <Col xs={1}>
                                    {
                                        (!view.isDefault && !selectedView) &&
                                        <span
                                            className="edit-inline-field__toggle"
                                            onClick={() => setSelectedView(view)}
                                        >
                                                <i className="fa fa-pencil" />
                                            </span>
                                    }
                                </Col>
                                <Col xs={1}>
                                    {
                                        (!view.isDefault && !selectedView) &&
                                        <span
                                            className="edit-inline-field__toggle"
                                            onClick={() => deleteSavedView(view.name)}
                                        >
                                                <i className="fa fa-trash-o" />
                                            </span>
                                    }
                                </Col>
                            </Row>
                        );
                    })}
            </Modal.Body>
            <Modal.Footer>
                <button
                    disabled={isSubmitting}
                    onClick={() => onDone(hasChange, selectDefaultView)}
                    className="btn btn-default pull-right"
                >
                    Done editing
                </button>
            </Modal.Footer>
        </Modal>
    );
});
