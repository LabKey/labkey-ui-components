import React, { ReactNode, FC, memo, useState, useEffect, useCallback } from 'react';

import { DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_CONCEPT_TOPIC } from '../../util/helpLinks';

import { ConceptModel, PathModel } from './models';
import { fetchConceptForCode } from './actions';
import { OntologyConceptSelectButton, OntologyConceptSelectButtonProps } from './OntologyConceptSelectButton';

interface OntologyConceptAnnotationProps {
    id: string;
    field: DomainField;
    onChange: (id: string, value: any) => void;
    successBsStyle?: string;
}

export const OntologyConceptAnnotation: FC<OntologyConceptAnnotationProps> = memo(props => {
    const { field, id, onChange } = props;
    const { principalConceptCode } = field;
    const [error, setError] = useState<string>();
    const [concept, setConcept] = useState<ConceptModel>();

    useEffect(() => {
        if (!principalConceptCode) {
            setConcept(undefined);
        } else {
            fetchConceptForCode(principalConceptCode)
                .then((concept: ConceptModel): void => {
                    setConcept(concept);
                    onChange?.(id, concept);
                })
                .catch(() => {
                    setError('Error: unable to get concept information for ' + principalConceptCode + '. ');
                });
        }
    }, [principalConceptCode, setConcept, setError]);

    const onApply = useCallback(
        (id: string, path: PathModel, concept: ConceptModel) => {
            onChange(id, concept);
        },
        [onChange]
    );

    return <OntologyConceptAnnotationImpl {...props} onChange={onApply} error={error} concept={concept} />;
});

// exported for jest testing
export const OntologyConceptAnnotationImpl: FC<OntologyConceptSelectButtonProps> = memo(props => {
    const { field } = props;

    return (
        <>
            <div className="domain-field-label">
                <DomainFieldLabel label="Ontology Concept" helpTipBody={getOntologyConceptAnnotationHelpTipBody()} />
            </div>
            <OntologyConceptSelectButton {...props} title="Select Concept" conceptCode={field.principalConceptCode} />
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
