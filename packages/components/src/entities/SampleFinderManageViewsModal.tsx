import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';

import { resolveErrorMessage } from '../internal/util/messaging';

import { Alert } from '../internal/components/base/Alert';
import { deleteReport, renameReport } from '../internal/query/reports';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { useAppContext } from '../internal/AppContext';

import { FinderReport } from '../internal/components/search/models';

interface Props {
    currentView?: FinderReport;
    onDone: (hasChange?: boolean) => void;
}

export const SampleFinderManageViewsModal: FC<Props> = memo(props => {
    const { onDone, currentView } = props;

    const [savedSearches, setSavedSearches] = useState<FinderReport[]>(undefined);
    const [selectedSearch, setSelectedSearch] = useState<FinderReport>(undefined);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [newName, setNewName] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const [hasChange, setHasChange] = useState<boolean>();

    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            try {
                const views = await api.samples.loadFinderSearches();
                setSavedSearches(views);
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            }
        })();
    }, []);

    const deleteView = useCallback(async entityId => {
        setErrorMessage(undefined);
        setIsSubmitting(true);
        setHasChange(true);

        try {
            await deleteReport(entityId);
            setSavedSearches(await api.samples.loadFinderSearches());
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const renameView = useCallback(async () => {
        const newNameTrimmed = newName?.trim();
        if (!selectedSearch || !newNameTrimmed) {
            setSelectedSearch(undefined);
            return;
        }

        if (selectedSearch.reportName.toLowerCase() === newNameTrimmed.toLowerCase()) {
            setSelectedSearch(undefined);
            return;
        }

        const existingViews = await api.samples.loadFinderSearches();
        let duplicate = false;
        existingViews.forEach(v => {
            if (v.reportName.toLowerCase() === newNameTrimmed.toLowerCase()) {
                duplicate = true;
            }
        });

        if (duplicate) {
            setErrorMessage('A saved search by the name "' + newNameTrimmed + '" already exists.');
            return;
        }

        setErrorMessage(undefined);
        setIsSubmitting(true);
        setHasChange(true);

        try {
            await renameReport(selectedSearch.entityId, newNameTrimmed);
            setSavedSearches(await api.samples.loadFinderSearches());
            setSelectedSearch(undefined);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedSearch, newName]);

    const onNewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setNewName(evt.target.value), []);

    return (
        <Modal onHide={() => onDone(hasChange)} show>
            <Modal.Header closeButton>
                <Modal.Title>Manage Saved Searches</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                {!savedSearches && <LoadingSpinner />}
                {savedSearches?.length === 0 && <div className="gray-text">No saved searches</div>}
                {savedSearches &&
                    savedSearches.map(savedSearch => {
                        const isLocked = savedSearch.entityId === currentView?.entityId;
                        return (
                            <Row className="small-margin-bottom">
                                <Col xs={8}>
                                    {selectedSearch?.reportId === savedSearch.reportId ? (
                                        <input
                                            autoFocus
                                            placeholder={selectedSearch.reportName}
                                            className="form-control"
                                            defaultValue={selectedSearch.reportName}
                                            onBlur={renameView}
                                            onChange={onNewNameChange}
                                            type="text"
                                        />
                                    ) : (
                                        savedSearch.reportName
                                    )}
                                </Col>
                                <Col xs={4}>
                                    <span className="pull-right">
                                        {!selectedSearch && !isLocked && (
                                            <>
                                                <span
                                                    className="edit-inline-field__toggle small-right-spacing"
                                                    onClick={() => setSelectedSearch(savedSearch)}
                                                >
                                                    <i className="fa fa-pencil" />
                                                </span>
                                                <span
                                                    className="edit-inline-field__toggle small-right-spacing"
                                                    onClick={() => deleteView(savedSearch.entityId)}
                                                >
                                                    <i className="fa fa-trash-o" />
                                                </span>
                                            </>
                                        )}
                                        {isLocked && (
                                            <OverlayTrigger
                                                overlay={
                                                    <Popover id="current-view-lock">
                                                        The active search cannot be deleted or renamed.
                                                    </Popover>
                                                }
                                                placement="top"
                                            >
                                                <span className="search-form__advanced-toggle small-right-spacing">
                                                    <i className="fa fa-lock" />
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </span>
                                </Col>
                            </Row>
                        );
                    })}
            </Modal.Body>
            <Modal.Footer>
                <button
                    disabled={isSubmitting}
                    onClick={() => onDone(hasChange)}
                    className="btn btn-default pull-right"
                >
                    Done editing
                </button>
            </Modal.Footer>
        </Modal>
    );
});
