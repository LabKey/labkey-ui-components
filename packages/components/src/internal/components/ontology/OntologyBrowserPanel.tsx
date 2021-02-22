import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyTabs } from './OntologyTabs';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, } from './models';

interface OntologyBrowserProps {
    ontologyId?: string;
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
            console.log(selectedCode); //TODO remove
        },
        [setSelectedConcept, conceptCache]
    );

    useEffect(() => {
        getOntologyDetails(ontologyId).then(details => {
            setOntologyModel(details);
        });
    }, [setOntologyModel]);

    useEffect(() => {
        const newConcept = conceptCache.get(selectedConceptCode);
        setSelectedConcept(newConcept);
    }, [selectedConceptCode, conceptCache, setSelectedConcept]);

    return (
        <OntologyBrowserPanelImpl
            ontology={ontology}
            selectedConcept={selectedConcept}
            setSelectedConcept={updateSelectedConceptCode}
        />
    );
});

interface ImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
}

export const OntologyBrowserPanelImpl: FC<ImplProps> = memo(props => {
    const { ontology, selectedConcept, ...rest } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const root = ontology.getPathModel();
    return (
        <>
            <div className="panel panel-default ontology-browser-container">
                <div className="ontology-browser-title">
                    <div className="panel-heading">{ontology.name}</div>
                </div>
                <div className="panel-body ontology-browser-body-panel">
                    <div className="ontology-browser-title-count">{ontology.conceptCount} total concepts </div>
                    <Row>
                        <Col xs={3} className="ontology-browser-left-panel no-padding">
                            <OntologyTabs root={root} {...rest} />
                        </Col>
                        <Col xs={9} className="ontology-browser-panel-right-panel">
                            <ConceptInformationTabs concept={selectedConcept} />
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    );
});
