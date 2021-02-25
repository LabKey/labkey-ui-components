import React, { ReactNode, FC, memo, useState, useCallback, useMemo } from 'react';
import { Button } from 'react-bootstrap';

import { createFormInputId, DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_TOPIC } from '../../util/helpLinks';
import { createFormInputName } from '../domainproperties/actions';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';
import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptModel } from "./models";

interface OntologyConceptAnnotationProps {
    id: string,
    field: DomainField;
    onChange: (id: string, value: any) => void;
    successBsStyle?: string;
}

export const OntologyConceptAnnotation: FC<OntologyConceptAnnotationProps> = memo(props => {
    const { id, field, successBsStyle, onChange } = props;
    const { principalConceptCode } = field;
    const [showModal, setShowModal] = useState<boolean>();
    const title = useMemo(() => (principalConceptCode ? 'Edit' : 'Select') + ' Concept', [principalConceptCode]);

    const toggleModal = useCallback(() => {
        setShowModal(!showModal);
    }, [showModal, setShowModal]);

    const onApply = useCallback(
        (concept: ConceptModel) => {
            onChange(id, concept?.code);
            setShowModal(false);
        },
        [onChange, id, setShowModal]
    );

    return (
        <>
            <div className="domain-field-label">
                <DomainFieldLabel label="Concept Annotation" helpTipBody={getOntologyConceptAnnotationHelpTipBody()} />
            </div>
            <div>
                <Button
                    className="domain-validation-button"
                    name={createFormInputName(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT)}
                    id={id}
                    disabled={isFieldFullyLocked(field.lockType)}
                    onClick={toggleModal}
                >
                    {title}
                </Button>
                {!principalConceptCode && <span className="domain-text-label">None Set</span>}
                {principalConceptCode && (
                    <a
                        className="domain-validator-link"
                        onClick={isFieldFullyLocked(field.lockType) ? () => {} : toggleModal}
                    >
                        {principalConceptCode}
                    </a>
                )}
            </div>
            {showModal && (
                <OntologyBrowserModal
                    title={title}
                    initOntologyId={field.sourceOntology}
                    onCancel={toggleModal}
                    onApply={onApply}
                    successBsStyle={successBsStyle}
                />
            )}
        </>
    );
});

function getOntologyConceptAnnotationHelpTipBody(): ReactNode {
    return (
        <>
            Select an ontology concept to attach to this field which will be used for ...TODO...
            <br />
            <br />
            Learn more about {helpLinkNode(ONTOLOGY_TOPIC, 'ontology integration')} in LabKey.
        </>
    );
}
