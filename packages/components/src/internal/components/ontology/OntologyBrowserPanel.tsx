import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { LoadingSpinner } from '../../..';

import { fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';

interface OntologyBrowserProps {
    ontologyId: string;
}

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const { ontologyId } = props;
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConceptCode, setSelectedCode] = useState<string>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();
    const [conceptCache, setConceptCache] = useState<Map<string, ConceptModel>>(new Map<string, ConceptModel>());

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
        [setSelectedConcept, conceptCache]
    );

    useEffect(() => {
        getOntologyDetails(ontologyId).then(details => {
            setOntologyModel(details);
        });
    }, [setOntologyModel, ontologyId]);

    useEffect(() => {
        setSelectedConcept(conceptCache.get(selectedConceptCode));
    }, [selectedConceptCode, conceptCache, setSelectedConcept]);

    return (
        <OntologyBrowserPanelImpl
            ontology={ontology}
            selectedConcept={selectedConcept}
            setSelectedConcept={updateSelectedConceptCode}
        />
    );
});

export interface OntologyBrowserPanelImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
}

export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const { ontology, selectedConcept, setSelectedConcept } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const root = ontology.getPathModel();
    return (
        <>
            <div className="panel panel-default ontology-browser-container">
                <div className="panel-heading">Browse {ontology.name}</div>
                <div className="panel-body">
                    <Row>
                        <Col xs={6} className="left-panel">
                            {/*TODO should we put any of the other ontology metadata here?*/}
                            <p>{ontology.conceptCount} total concepts</p>
                            <OntologyTreePanel root={root} onNodeSelection={setSelectedConcept} />
                        </Col>
                        <Col xs={6} className="right-panel">
                            <ConceptInformationTabs concept={selectedConcept} />
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    );
});
