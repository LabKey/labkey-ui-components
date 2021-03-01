import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, LoadingSpinner } from '../../..';

import { fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';

export interface OntologyBrowserProps {
    initOntologyId?: string;
    asPanel?: boolean;
    onConceptSelect?: (concept: ConceptModel) => void;
}

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const { initOntologyId, asPanel, onConceptSelect } = props;
    const [error, setError] = useState<string>();
    const [selectedOntologyId, setSelectedOntologyId] = useState<string>();
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConceptCode, setSelectedCode] = useState<string>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();
    const [conceptCache, setConceptCache] = useState<Map<string, ConceptModel>>(new Map<string, ConceptModel>());
    const ontologyId = selectedOntologyId ?? (!error ? initOntologyId : undefined);

    const cacheConcepts = useCallback(
        (concepts: ConceptModel[]): void => {
            concepts.forEach((concept): void => {
                if (!conceptCache.has(concept.code)) {
                    conceptCache.set(concept.code, concept);
                }
            });
            setConceptCache(new Map(conceptCache));
        },
        [conceptCache, setConceptCache]
    );

    const updateSelectedConceptCode = useCallback(
        async (selectedCode: string): Promise<void> => {
            if (!conceptCache.has(selectedCode)) {
                const concept = await fetchConceptForCode(selectedCode);
                cacheConcepts([concept]);
            }
            setSelectedCode(selectedCode);
        },
        [setSelectedCode, conceptCache]
    );

    const onOntologySelection = useCallback(
        (name: string, value: string, model: PathModel) => {
            setSelectedOntologyId(model?.path.replace(/\//g, ''));
        },
        [setSelectedOntologyId]
    );

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then(setOntologyModel)
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                    setSelectedOntologyId(undefined);
                });
        } else {
            setOntologyModel(undefined);
        }
    }, [setOntologyModel, selectedOntologyId, setSelectedOntologyId, setError]);

    useEffect(() => {
        const concept = conceptCache.get(selectedConceptCode);
        setSelectedConcept(concept);
        onConceptSelect?.(concept);
    }, [selectedConceptCode, conceptCache, setSelectedConcept, onConceptSelect]);

    return (
        <>
            <Alert>{error}</Alert>
            {!ontologyId && <OntologySelectionPanel onOntologySelection={onOntologySelection} asPanel={asPanel} />}
            {ontologyId && (
                <OntologyBrowserPanelImpl
                    ontology={ontology}
                    selectedConcept={selectedConcept}
                    setSelectedConcept={updateSelectedConceptCode}
                    asPanel={asPanel}
                />
            )}
        </>
    );
});

OntologyBrowserPanel.defaultProps = {
    asPanel: true,
};

interface OntologyBrowserPanelImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
    asPanel: boolean;
}

// exported for jest testing
export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const { ontology, selectedConcept, setSelectedConcept, asPanel } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const { conceptCount, description } = ontology;
    const root = ontology.getPathModel();

    const body = (
        <>
            {description && <p className="ontology-description">{description}</p>}
            <Row>
                <Col xs={6} className="left-panel">
                    <p className="ontology-concept-count">{conceptCount} total concepts</p>
                    <OntologyTreePanel root={root} onNodeSelection={setSelectedConcept} />
                </Col>
                <Col xs={6} className="right-panel">
                    <ConceptInformationTabs concept={selectedConcept} />
                </Col>
            </Row>
        </>
    );

    if (!asPanel) {
        return <div className="ontology-browser-container">{body}</div>;
    }

    return (
        <div className="panel panel-default ontology-browser-container">
            <div className="panel-heading">Browse {ontology.getDisplayName()}</div>
            <div className="panel-body">{body}</div>
        </div>
    );
});
