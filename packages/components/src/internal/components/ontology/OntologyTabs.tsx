import React, { FC } from 'react';
import { Col, Nav, NavItem, Row, Tab } from 'react-bootstrap';

import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologyModel } from './models';

export const enum OntologyPickerTabs {
    ONTOLOGY_TREE_TAB = 'ontologytree',
    ONTOLOGY_SEARCH_TAB = 'search',
}

interface OntologyTabsProps {
    root: PathModel;
    setSelectedConcept: (conceptCode: string) => void;
    loadConcepts: (concepts: ConceptModel[]) => void;
}

export const OntologyTabs: FC<OntologyTabsProps> = props => {
    const { model } = props;
    const treeModel = { title: model.name };

    return (
        <div>
            <Tab.Container id="ontology-browser-tabs-container" defaultActiveKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}>
                <Row>
                    <Col sm={12}>
                        <Nav bsStyle="tabs">
                            <NavItem eventKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}>Concepts</NavItem>
                            {/*<NavItem eventKey={OntologyPickerTabs.ONTOLOGY_SEARCH_TAB}>Search</NavItem>*/}
                        </Nav>
                    </Col>
                    <Col sm={12}>
                        <Tab.Content animation>
                            <Tab.Pane
                                className="ontology-browser-panel-tree-pane"
                                eventKey={OntologyPickerTabs.ONTOLOGY_TREE_TAB}
                            >
                                <OntologyTreePanel model={treeModel} />
                                {/*<OntologyTreePanel model={waffle} treeData={treeData} onNodeToggle={onToggle} />*/}
                            </Tab.Pane>
                            {/*<Tab.Pane*/}
                            {/*    className="margin-bottom margin-top"*/}
                            {/*    eventKey={OntologyPickerTabs.ONTOLOGY_SEARCH_TAB}*/}
                            {/*>*/}
                            {/*    <div>We are searching here.</div>*/}
                            {/*</Tab.Pane>*/}
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
};
