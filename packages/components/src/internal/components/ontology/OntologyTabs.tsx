import React, { FC, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab } from 'react-bootstrap';

import { OntologyTreePanel } from './OntologyTreePanel';
import { ConceptModel, OntologyModel, PathModel } from './models';

const enum OntologyPickerTabs {
    ONTOLOGY_TREE_TAB = 'ontologytree',
    ONTOLOGY_SEARCH_TAB = 'search',
}

interface OntologyTabsProps {
    root: PathModel;
    setSelectedConcept: (conceptCode: string) => void;
    loadConcepts: (concepts: ConceptModel[]) => void;
}

export const OntologyTabs: FC<OntologyTabsProps> = props => {
    const [root] = useState(props.root); // Using state as the tree control uses the original object to maintain expansion, loading, etc.

    return (
        <div>
            <Tab.Container id="ontology-browser-tabs-container" defaultActiveKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}>
                <Row>
                    <Col sm={12}>
                        <Nav bsStyle="tabs">
                            <NavItem eventKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}>Concepts</NavItem>
                        </Nav>
                    </Col>
                    <Col sm={12}>
                        <Tab.Content animation>
                            <Tab.Pane
                                className="ontology-browser-panel-tree-pane"
                                eventKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}
                            >
                                <OntologyTreePanel root={root} onNodeSelection={props.setSelectedConcept} loadConcepts={props.loadConcepts} />
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
};
