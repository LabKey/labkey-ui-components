import React, { ReactNode, FC, memo, useState, useCallback, useMemo } from 'react';
import { Button } from 'react-bootstrap';

import { DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_TOPIC } from '../../util/helpLinks';
import { createFormInputName } from '../domainproperties/actions';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';
import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptOverviewModal } from './ConceptOverviewPanel';
import { ConceptModel } from './models';

interface OntologyConceptAnnotationProps {
    id: string;
    field: DomainField;
    onChange: (id: string, value: any) => void;
    successBsStyle?: string;
}

export const OntologyConceptAnnotation: FC<OntologyConceptAnnotationProps> = memo(props => {
    const { id, field, successBsStyle, onChange } = props;
    const { principalConceptCode, lockType } = field;
    const [showSelectModal, setShowSelectModal] = useState<boolean>();
    const [showConceptModal, setShowConceptModal] = useState<boolean>();
    const title = 'Select Concept'; //useMemo(() => (principalConceptCode ? 'Edit' : 'Select') + ' Concept', [principalConceptCode]);
    const isFieldLocked = useMemo(() => isFieldFullyLocked(lockType), [lockType]);

    const toggleSelectModal = useCallback(() => {
        setShowSelectModal(!showSelectModal);
    }, [showSelectModal, setShowSelectModal]);

    const toggleConceptModal = useCallback(() => {
        setShowConceptModal(!showConceptModal);
    }, [showConceptModal, setShowConceptModal]);

    const onApply = useCallback(
        (concept: ConceptModel) => {
            onChange(id, concept?.code);
            setShowSelectModal(false);
        },
        [onChange, id, setShowSelectModal]
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
                    disabled={isFieldLocked}
                    onClick={toggleSelectModal}
                >
                    {title}
                </Button>
                {!principalConceptCode && <span className="domain-text-label">None Set</span>}
                {principalConceptCode && (
                    <>
                        {!isFieldLocked && (
                            <a className="domain-validator-link" onClick={() => onApply(undefined)}>
                                <i className="fa fa-remove" />
                            </a>
                        )}
                        <a className="domain-validator-link" onClick={toggleConceptModal}>
                            {principalConceptCode}
                        </a>
                    </>
                )}
            </div>
            {showSelectModal && (
                <OntologyBrowserModal
                    title={title}
                    initOntologyId={field.sourceOntology}
                    onCancel={toggleSelectModal}
                    onApply={onApply}
                    successBsStyle={successBsStyle}
                />
            )}
            {showConceptModal && <ConceptOverviewModal code={principalConceptCode} onClose={toggleConceptModal} />}
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
