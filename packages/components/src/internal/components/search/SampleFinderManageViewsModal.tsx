import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';

import { resolveErrorMessage } from '../../util/messaging';

import { Alert } from '../base/Alert';
import { deleteReport, renameReport } from '../../query/reports';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { FinderReport } from './models';
import {useAppContext} from "../../AppContext";

export interface Props {
    onDone: (hasChange?: boolean) => void;
    currentView?: FinderReport;
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
        }
        finally {
            setIsSubmitting(false);
        }
    }, []);

    const renameView = useCallback(async () => {
        if (!selectedSearch || !newName) {
            setSelectedSearch(undefined);
            return;
        }

        if (selectedSearch.reportName.toLowerCase() === newName.toLowerCase()) {
            setSelectedSearch(undefined);
            return;
        }

        setErrorMessage(undefined);
        setIsSubmitting(true);
        setHasChange(true);

        try {
            await renameReport(selectedSearch.entityId, newName);
            setSavedSearches(await api.samples.loadFinderSearches());
            setSelectedSearch(undefined);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        }
        finally {
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
                {savedSearches &&
                    savedSearches.map(savedSearch => {
                        const isLocked = savedSearch.entityId === currentView?.entityId;
                        return (
                            <Row className="small-margin-bottom">
                                <Col xs={5}>
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
                                {!selectedSearch && !isLocked && (
                                    <>
                                        <Col xs={1}>
                                            <span
                                                className="edit-inline-field__toggle"
                                                onClick={() => setSelectedSearch(savedSearch)}
                                            >
                                                    <i className="fa fa-pencil" />
                                                </span>
                                        </Col>
                                        <Col xs={1}>
                                            <span
                                                className="edit-inline-field__toggle"
                                                onClick={() => deleteView(savedSearch.entityId)}
                                            >
                                                    <i className="fa fa-trash-o" />
                                                </span>
                                        </Col>
                                    </>
                                )}
                                {isLocked && (
                                    <>
                                        <Col xs={1} />
                                        <Col xs={1}>
                                            <span>
                                                <i className="fa fa-lock" />
                                            </span>
                                        </Col>
                                    </>
                                )}
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
