import React, { FC, memo, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { Alert, naturalSort } from '../../..';

import { ConceptModel, PathModel } from './models';
import { fetchConceptForCode } from './actions';
import { ConceptPathDisplay } from './ConceptPath';

const CURRENT_PATH_TITLE = 'Current Path';

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
    selectedPath?: PathModel;
}

function renderConceptSynonyms(synonyms: string[]): React.ReactNode {
    if (!synonyms || synonyms.length === 0) return undefined;

    const synonymList = synonyms.sort(naturalSort).map(synonym => {
        return <div key={synonym}>{synonym}</div>;
    });

    return (
        <div>
            <div className="synonyms-title">Synonyms</div>
            <div className="synonyms-text">{synonymList}</div>
        </div>
    );
}

/**
 * The ontology concept overview display panel that takes in the concept prop (i.e. ConceptModel) and displays
 * the information about the concept label, code, description, etc.
 */
export const ConceptOverviewPanelImpl: FC<ConceptOverviewPanelImplProps> = memo(props => {
    const { concept, selectedPath = undefined } = props;

    if (!concept) {
        return <div className="none-selected">No concept selected</div>;
    }

    const { code, label, description, synonyms } = concept;
    const rSynonyms = renderConceptSynonyms(synonyms);

    return (
        <>
            {selectedPath && (
                <ConceptPathDisplay
                    title={CURRENT_PATH_TITLE}
                    path={selectedPath}
                    isSelected={true}
                    isCollapsed={true}
                />
            )}
            {label && <div className="title margin-bottom">{label}</div>}
            {code && <span className="code">{code}</span>}
            {description && (
                <div>
                    <div className="description-title">Description</div>
                    <p className="description-text">{description}</p>
                </div>
            )}
            {synonyms && rSynonyms}
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
