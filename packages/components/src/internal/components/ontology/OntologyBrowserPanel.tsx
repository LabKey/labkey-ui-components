import React, { FC, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyTabs } from './OntologyTabs';
import { ConceptInformationTabs, ConceptInfoTabs } from './ConceptInformationTabs';
import { getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel } from './models';

export interface OntologyBrowserProps {
    ontologyId?: number;
}

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

    if (!ontology) {
        return <LoadingSpinner />;
    }

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
