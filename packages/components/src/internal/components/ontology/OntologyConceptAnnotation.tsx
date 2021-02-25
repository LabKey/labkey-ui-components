import React, { ReactNode, FC, memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from 'react-bootstrap';

import { DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_TOPIC } from '../../util/helpLinks';
import { createFormInputName } from '../domainproperties/actions';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';

import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptOverviewModal } from './ConceptOverviewPanel';
import { ConceptModel } from './models';
import { fetchConceptForCode } from './actions';

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
    const [error, setError] = useState<string>();
    const [concept, setConcept] = useState<ConceptModel>();
    const title = 'Select Concept'; // useMemo(() => (principalConceptCode ? 'Edit' : 'Select') + ' Concept', [principalConceptCode]);
    const isFieldLocked = useMemo(() => isFieldFullyLocked(lockType), [lockType]);

    useEffect(() => {
        if (!principalConceptCode) {
            setConcept(undefined);
        } else {
            fetchConceptForCode(principalConceptCode)
                .then(setConcept)
                .catch(reason => {
                    setError(
                        'Error: unable to get concept information for ' + principalConceptCode + '. '
                    );
                });
        }
    }, [principalConceptCode, setConcept, setError]);

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
            <table className="domain-annotation-table">
                <tbody>
                    <tr>
                        <td>
                            <Button
                                className="domain-validation-button"
                                name={createFormInputName(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT)}
                                id={id}
                                disabled={isFieldLocked}
                                onClick={toggleSelectModal}
                            >
                                {title}
                            </Button>
                        </td>
                        {!principalConceptCode && (
                            <td className="content">
                                <span className="domain-text-label">None Set</span>
                            </td>
                        )}
                        {principalConceptCode && (
                            <>
                                {!isFieldLocked && (
                                    <td className="content">
                                        <a className="domain-validator-link" onClick={() => onApply(undefined)}>
                                            <i className="fa fa-remove" />
                                        </a>
                                    </td>
                                )}
                                <td className="content">
                                    <a
                                        className="domain-validator-link domain-annotation-item"
                                        onClick={toggleConceptModal}
                                    >
                                        {concept?.getDisplayLabel() ?? principalConceptCode}
                                    </a>
                                </td>
                            </>
                        )}
                    </tr>
                </tbody>
            </table>
            {showSelectModal && (
                <OntologyBrowserModal
                    title={title}
                    initOntologyId={field.sourceOntology}
                    onCancel={toggleSelectModal}
                    onApply={onApply}
                    successBsStyle={successBsStyle}
                />
            )}
            {showConceptModal && <ConceptOverviewModal concept={concept} error={error} onClose={toggleConceptModal} />}
        </>
    );
});

function getOntologyConceptAnnotationHelpTipBody(): ReactNode {
    return (
        <>
            Select an ontology concept to use as an annotation for this field.
            {/* TODO anything else to add?*/}
            <br />
            <br />
            Learn more about {helpLinkNode(ONTOLOGY_TOPIC, 'ontology integration')} in LabKey.
        </>
    );
}
