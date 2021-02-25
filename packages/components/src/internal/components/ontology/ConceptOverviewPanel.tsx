import React, { FC, memo, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { Alert } from '../../..';

import { ConceptModel } from './models';
import { fetchConceptForCode } from './actions';

interface ConceptOverviewPanelProps {
    concept: ConceptModel;
}

export const ConceptOverviewPanel: FC<ConceptOverviewPanelProps> = memo(props => {
    const { concept } = props;

    if (!concept) {
        return <div className="none-selected">No concept selected</div>;
    }

    const { code, label, description } = concept;

    return (
        <>
            {label && <div className="title margin-bottom">{label}</div>}
            {code && <span className="code">{code}</span>}
            {description && (
                <div>
                    <div className="description-title">Description</div>
                    <p className="description-text">{description}</p>
                </div>
            )}
        </>
    );
});

interface ConceptOverviewModalProps {
    concept: ConceptModel;
    error?: string;
    onClose: () => void;
}

export const ConceptOverviewModal: FC<ConceptOverviewModalProps> = memo(props => {
    const { onClose, concept, error } = props;

    return (
        <Modal show={true} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Concept Overview</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{error}</Alert>
                {!error && (
                    <div className="ontology-concept-overview-container">
                        <ConceptOverviewPanel concept={concept} />
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
});
