import React, { FC, memo } from 'react';
import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { ConceptModel } from './models';

interface OntologyBrowserFilterPanelProps {
    ontologyId: string;
    selectedConcept: ConceptModel;
    onConceptSelection: (ConceptModel) => void;
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, onConceptSelection, selectedConcept } = props;
    return (
        <>
            <OntologyBrowserPanel
                asPanel={false}
                hideConceptInfo={true}
                initOntologyId={ontologyId}
                onConceptSelect={onConceptSelection}
                initialConcept={selectedConcept}
            />
        </>
    );
});
