import React, { FC, memo, SyntheticEvent, useCallback, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab, TabContainer } from 'react-bootstrap';

import { ConceptModel, PathModel } from './models';
import { ConceptOverviewPanelImpl } from './ConceptOverviewPanel';
import { ConceptPathInfo } from './ConceptPathInfo';

interface ConceptInformationTabsProps {
    concept?: ConceptModel;
    selectedPath?: PathModel;
    alternatePathClickHandler: (path: PathModel) => void;
}

export const enum ConceptInfoTabs {
    CONCEPT_OVERVIEW_TAB = 'overview',
    PATH_INFO_TAB = 'pathinfo',
}

export const ConceptInformationTabs: FC<ConceptInformationTabsProps> = memo(props => {
    const { concept, selectedPath, alternatePathClickHandler } = props;
    const [activeTab, setActiveTab] = useState<ConceptInfoTabs>(ConceptInfoTabs.CONCEPT_OVERVIEW_TAB);

    const onSelectionChange = useCallback(
        (event: SyntheticEvent<TabContainer, Event>) => {
            const tab: ConceptInfoTabs = event as any; // Crummy cast to make TS happy
            setActiveTab(tab);
        },
        [setActiveTab]
    );

    return (
        <Tab.Container
            id="concept-information-tabs"
            className="concept-information-tabs"
            onSelect={onSelectionChange}
            activeKey={activeTab}
            defaultActiveKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
        >
            <Row className="clearfix">
                <Col>
                    <Nav bsStyle="tabs">
                        <NavItem eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}>Overview</NavItem>
                        <NavItem eventKey={ConceptInfoTabs.PATH_INFO_TAB}>Path Information</NavItem>
                    </Nav>
                </Col>
                <Col>
                    <Tab.Content animation>
                        <Tab.Pane
                            className="ontology-concept-overview-container"
                            eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
                        >
                            <ConceptOverviewPanelImpl concept={concept} selectedPath={selectedPath} />
                        </Tab.Pane>
                        <Tab.Pane
                            className="ontology-concept-pathinfo-container"
                            eventKey={ConceptInfoTabs.PATH_INFO_TAB}
                        >
                            <ConceptPathInfo
                                selectedCode={concept?.code}
                                selectedPath={selectedPath}
                                alternatePathClickHandler={alternatePathClickHandler}
                            />
                        </Tab.Pane>
                    </Tab.Content>
                </Col>
            </Row>
        </Tab.Container>
    );
});
