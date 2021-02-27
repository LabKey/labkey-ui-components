import React, { FC, memo, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { Alert } from '../../..';

import { ConceptModel } from './models';
import { fetchConceptForCode } from './actions';

interface ConceptOverviewPanelProps {
    code: string;
}

/**
 * An ontology concept overview panel that takes in a concept code as a prop and will load the concept details
 * to show in the ConceptOverviewPanelImpl.
 */
export const OntologyConceptOverviewPanel: FC<ConceptOverviewPanelProps> = memo(props => {
    const { code } = props;
    const [error, setError] = useState<string>();
    const [concept, setConcept] = useState<ConceptModel>();

    useEffect(() => {
        if (code) {
            fetchConceptForCode(code)
                .then(setConcept)
                .catch(() => {
                    setError('Error: unable to get concept information for ' + code + '. ');
                });
        }
    }, [code, setConcept, setError]);

    return (
        <>
            <Alert>{error}</Alert>
            {concept && <ConceptOverviewPanelImpl concept={concept} />}
        </>
    );
});

interface ConceptOverviewPanelImplProps {
    concept: ConceptModel;
}

/**
 * The ontology concept overview display panel that takes in the concept prop (i.e. ConceptModel) and displays
 * the information about the concept label, code, description, etc.
 */
export const ConceptOverviewPanelImpl: FC<ConceptOverviewPanelImplProps> = memo(props => {
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

/**
 * A modal dialog version that will display the same concept overview display panel from ConceptOverviewPanelImpl
 * but in a modal dialog. This component takes in the concept (i.e. ConceptModel) as a prop.
 */
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
                        <ConceptOverviewPanelImpl concept={concept} />
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
});
