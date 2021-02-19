import React, { FC, memo, ReactNode, SyntheticEvent, useCallback, useEffect, useState } from "react";
import {Col, Nav, NavItem, Panel, Row, Tab, TabContainer} from "react-bootstrap";
import {ConceptModel} from "./models";
import { LoadingSpinner } from '../base/LoadingSpinner';

interface ConceptInformationTabsProps {
    concept?: ConceptModel;
}

const enum ConceptInfoTabs {
    CONCEPT_OVERVIEW_TAB = 'overview',
    PATH_INFO_TAB = 'pathinfo',
}

export const ConceptInformationTabs: FC<ConceptInformationTabsProps> = memo(props => {
    const { concept } = props;
    const [activeTab, setActiveTab] = useState<ConceptInfoTabs>(ConceptInfoTabs.CONCEPT_OVERVIEW_TAB);

    const onSelectionChange = useCallback(
        (event: SyntheticEvent<TabContainer, Event>) => {
            const tab: ConceptInfoTabs = event as any; // Crummy cast to make TS happy
            setActiveTab(tab);
        },
        [setActiveTab]
    );

    return (
        <>
            <div>
                <Tab.Container
                    id="concept-information-tabs"
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
                        <Col className="left-spacing">
                            <Tab.Content animation>
                                <Tab.Pane
                                    className="ontology-concept-overview-container"
                                    eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
                                >
                                    <ConceptOverviewPanel concept={concept} />
                                </Tab.Pane>
                                <Tab.Pane
                                    className="ontology-concept-pathinfo-container"
                                    eventKey={ConceptInfoTabs.PATH_INFO_TAB}
                                >
                                    <div className="ontology-concept-pathinfo">Path Info is here</div>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        </>
    );
});

// Read-only element displaying the concept's details
const ConceptOverviewPanel: FC<{ concept: ConceptModel }> = memo(props => {
    const { concept } = props;

    if (!concept) {
        return <LoadingSpinner />;
    }

    const { label, description } = concept;

    const renderDescription = (): ReactNode => {
        if (!description) return undefined;

        return (
            <div className="margin-bottom">
                <div className="ontology-concept-overview-description-title">Description</div>
                <div className="ontology-concept-overview-description-text">{description}</div>
            </div>
        );
    };

    return (
        <>
            {label && <div className="ontology-concept-overview-title margin-bottom">{label}</div>}
            {renderDescription}
        </>
    );
});
