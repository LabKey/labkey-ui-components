import React, { FC, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyTabs } from './OntologyTabs';
import { ConceptInformationTabs, ConceptInfoTabs } from './ConceptInformationTabs';
import { getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, } from './models';

export interface OntologyBrowserProps {
    ontologyId?: number;
}

// class ConceptCache {
//     readonly loader: (code: string) => Promise<ConceptModel>;
//     private cache: Map<string, ConceptModel>;
//
//     constructor(loader: (code: string) => Promise<ConceptModel>) {
//         this.loader = loader;
//         this.cache = new Map<string, ConceptModel>();
//     }
//
//     async get(conceptCode: string): Promise<ConceptModel> {
//         let concept = this.cache[conceptCode];
//         if (concept) return concept;
//
//         concept = await this.loader(conceptCode);
//         this.cache.set(conceptCode, concept);
//         return concept;
//     }
// }

// // TODO remove when this becomes dynamic
// const mockConcept = {
//     name: 'widgets',
//     code: 'CodedWidgets',
//     paths: undefined,
//     description: 'I am a big long description',
// } as ConceptModel;

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
        (selectedCode: string): void => {
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
            loadConcepts={cacheConcepts}
        />
    );
});

interface ImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
    loadConcepts: (concepts: ConceptModel[]) => void;
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
                <Row>
                    <Col xs={3} className="ontology-browser-left-panel">
                        <OntologyHeader title={ontology.name} count={ontology.conceptCount} />
                        <OntologyTabs model={ontology} />
                    </Col>
                    <Col xs={9} className="ontology-browser-panel-right-panel">
                        <ConceptInformationTabs
                            concept={selectedConcept}
                            activeTab={conceptTab}
                            onTabChange={setActiveTab}
                        />
                    </Col>
                </Row>
            </div>
        </>
    );
};

const OntologyHeader: FC<{ title: string; count: number }> = props => {
    const { title, count } = props;
    return (
        <>
            <div className="ontology-browser-title">
                <div className="ontology-browser-title-name">{title}</div>
                <div className="ontology-browser-title-count">{count} total concepts </div>
            </div>
        </>
    );
};
