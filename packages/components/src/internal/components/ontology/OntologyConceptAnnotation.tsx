import React, { ReactNode, FC, memo, useCallback, useEffect, useState } from 'react';

import { DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_CONCEPT_TOPIC } from '../../util/helpLinks';

import { ConceptModel, PathModel } from './models';
import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';
import { fetchConceptForCode } from './actions';

interface OntologyConceptAnnotationProps {
    id: string;
    field: DomainField;
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
