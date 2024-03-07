import React, { FC, memo } from 'react';

import { Tab, Tabs } from '../../Tabs';

import { ConceptModel, PathModel } from './models';
import { ConceptOverviewPanelImpl } from './ConceptOverviewPanel';
import { ConceptPathInfo } from './ConceptPathInfo';

interface ConceptInformationTabsProps {
    concept?: ConceptModel;
    selectedPath?: PathModel;
    alternatePathClickHandler: (path: PathModel, isAlternatePath?: boolean) => void;
}

export enum ConceptInfoTabs {
    CONCEPT_OVERVIEW_TAB = 'overview',
    PATH_INFO_TAB = 'pathinfo',
}

export const ConceptInformationTabs: FC<ConceptInformationTabsProps> = memo(props => {
    const { concept, selectedPath, alternatePathClickHandler } = props;
    return (
        <Tabs className="concept-information-tabs">
            <Tab
                className="ontology-concept-overview-container"
                eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
                title="Overview"
            >
                <ConceptOverviewPanelImpl concept={concept} selectedPath={selectedPath} />
            </Tab>
            <Tab
                className="ontology-concept-pathinfo-container"
                eventKey={ConceptInfoTabs.PATH_INFO_TAB}
                title="Path Information"
            >
                <ConceptPathInfo
                    selectedCode={concept?.code}
                    selectedPath={selectedPath}
                    alternatePathClickHandler={alternatePathClickHandler}
                />
            </Tab>
        </Tabs>
    );
});
