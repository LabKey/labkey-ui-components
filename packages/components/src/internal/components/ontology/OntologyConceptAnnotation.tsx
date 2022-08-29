import React, { ReactNode, FC, memo, useCallback } from 'react';

import { helpLinkNode, ONTOLOGY_CONCEPT_TOPIC } from '../../util/helpLinks';

import { DomainField } from '../domainproperties/models';

import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';

import { ConceptModel, PathModel } from './models';
import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';

interface OntologyConceptAnnotationProps {
    field: DomainField;
    id: string;
    onChange: (id: string, value: any) => void;
    successBsStyle?: string;
}

export const OntologyConceptAnnotation: FC<OntologyConceptAnnotationProps> = memo(props => {
    const { onChange } = props;

    const onApply = useCallback(
        (id: string, path: PathModel, concept: ConceptModel) => {
            onChange(id, concept);
        },
        [onChange]
    );

    return (
        <>
            <div className="domain-field-label">
                <DomainFieldLabel label="Ontology Concept" helpTipBody={getOntologyConceptAnnotationHelpTipBody()} />
            </div>
            <OntologyConceptSelectButton
                {...props}
                title="Select Concept"
                valueProp="principalConceptCode"
                valueIsPath={false}
                onChange={onApply}
            />
        </>
    );
});

function getOntologyConceptAnnotationHelpTipBody(): ReactNode {
    return (
        <>
            <p>Select an ontology concept to use as an annotation for this field.</p>
            <p>Learn more about {helpLinkNode(ONTOLOGY_CONCEPT_TOPIC, 'ontology integration')} in LabKey.</p>
        </>
    );
}
