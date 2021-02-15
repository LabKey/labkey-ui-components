import React, { FC, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyTabs } from './OntologyTabs';
import { ConceptInformationTabs, ConceptInfoTabs } from './ConceptInformationTabs';
import { getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';

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


interface ConceptPathModel {
    path: string;
    conceptCode: string;
    children: ConceptPathModel[];
}

// TODO remove when this becomes dynamic
const mockConcept = {
    name: 'widgets',
    code: 'CodedWidgets',
    paths: undefined,
    description: 'I am a big long description',
} as ConceptModel;

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = props => {
    const { ontologyId } = props;

    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [conceptTab, setActiveTab] = useState<ConceptInfoTabs>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();
    const [conceptCache, setConceptCache] = useState<Map<string, ConceptModel>>();

    const cacheConcepts = useCallback(
        (concepts: ConceptModel[]): void => {
            concepts.forEach(concept => {
                if (!conceptCache.has(concept.code)) conceptCache.set(concept.code, concept);
            });
        },
        [conceptCache, setConceptCache]
    );

    const updateSelectedConcept = useCallback(
        (selectedCode: string): void => {
            // TODO load the concept ...
            // const selectedConcept = conceptCache.get(selectedCode);
            // setSelectedConcept(selectedConcept);
            console.log(selectedCode);
        },
        [setSelectedConcept, conceptCache]
    );

    useEffect(() => {
        getOntologyDetails(ontologyId).then(details => {
            setOntologyModel(details);
            // setOntologyName(details.name);
            // setConceptCount(details.conceptCount);
        });
    }, [setOntologyModel]);

    useEffect(() => {
        setSelectedConcept(mockConcept);
    }, [setSelectedConcept]);

    return <OntologyBrowserPanelImpl ontology={ontology} selectedConcept={selectedConcept} setSelectedConcept={updateSelectedConcept} />;
});

interface ImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    setSelectedConcept: (conceptCode: string) => void;
}

export const OntologyBrowserPanelImpl: FC<ImplProps> = memo(props => {
    const { ontology, selectedConcept, setSelectedConcept } = props;

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
