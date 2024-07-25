import React, { FC, memo, ReactNode, useCallback } from 'react';

import { ADVANCED_FIELD_EDITOR_TOPIC, HelpLink, ONTOLOGY_LOOKUP_TOPIC } from '../../util/helpLinks';

import { DomainField } from '../domainproperties/models';

import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';

import { ConceptModel, PathModel } from './models';
import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';
import { sampleManagerIsPrimaryApp } from '../../app/utils';

interface OntologyConceptAnnotationProps {
    field: DomainField;
    id: string;
    onChange: (id: string, value: any) => void;
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
            <p>Learn more about{' '}<HelpLink topic={sampleManagerIsPrimaryApp() ?  ADVANCED_FIELD_EDITOR_TOPIC : ONTOLOGY_LOOKUP_TOPIC }>ontology integration</HelpLink>{' '}in LabKey.</p>
        </>
    );
}
