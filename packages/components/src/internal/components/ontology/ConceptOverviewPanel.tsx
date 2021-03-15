import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { naturalSort } from '../../../public/sort';

import { ConceptModel, PathModel } from './models';
import { fetchConceptForCode } from './actions';
import { ConceptPathDisplay } from './ConceptPathDisplay';

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

const ConceptSynonyms: FC<{ synonyms: string[] }> = memo(props => {
    const { synonyms } = props;
    if (!synonyms || synonyms.length === 0) return undefined;

    const synonymList = synonyms.sort(naturalSort).map(synonym => {
        return <li key={synonym}>{synonym}</li>;
    });

    return (
        <>
            <div className="synonyms-title">Synonyms</div>
            <ul className="synonyms-text">{synonymList}</ul>
        </>
    );
});

/**
 * The ontology concept overview display panel that takes in the concept prop (i.e. ConceptModel) and displays
 * the information about the concept label, code, description, etc.
 */
export const ConceptOverviewPanelImpl: FC<ConceptOverviewPanelImplProps> = memo(props => {
    const { concept, selectedPath = undefined } = props;
    const [showPath, setShowPath] = useState<boolean>();

    const handleShowPath = useCallback((): void => {
        setShowPath(!showPath);
    }, [showPath, setShowPath]);

    if (!concept) {
        return <div className="none-selected">No concept selected</div>;
    }

    const { code, label, description, synonyms } = concept;

    return (
        <>
            {selectedPath && (
                <div className="button-container">
                    <Button className={showPath ? 'show-path' : ''} onClick={handleShowPath}>
                        {showPath ? 'Hide ' : 'Show '} Path
                    </Button>
                </div>
            )}
            {label && <div className="title small-margin-bottom">{label}</div>}
            {code && <span className="code margin-bottom">{code}</span>}
            {selectedPath && (
                <div className="concept-overview-selected-path">
                    {showPath && (
                        <>
                            <ConceptPathDisplay title={CURRENT_PATH_TITLE} path={selectedPath} isSelected={true} />
                        </>
                    )}
                </div>
            )}
            {description && (
                <div>
                    <div className="description-title">Description</div>
                    <p className="description-text">{description}</p>
                </div>
            )}
            <ConceptSynonyms synonyms={synonyms} />
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
