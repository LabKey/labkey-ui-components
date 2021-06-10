import React, { ReactNode, FC, memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from 'react-bootstrap';

import { DomainField, DomainFieldLabel } from '../../..';

import { helpLinkNode, ONTOLOGY_CONCEPT_TOPIC } from '../../util/helpLinks';
import { createFormInputName } from '../domainproperties/actions';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';

import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptOverviewTooltip } from './ConceptOverviewPanel';
import { ConceptModel } from './models';
import { fetchConceptForCode } from './actions';
import classNames from 'classnames';

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

    return <OntologyConceptAnnotationImpl {...props} error={error} concept={concept} />;
});

interface OntologyConceptAnnotationImplProps extends OntologyConceptAnnotationProps {
    error: string;
    concept: ConceptModel;
}

// exported for jest testing
export const OntologyConceptAnnotationImpl: FC<OntologyConceptAnnotationImplProps> = memo(props => {
    const { id, field, successBsStyle, onChange, error, concept } = props;
    const { principalConceptCode, lockType } = field;
    const [showSelectModal, setShowSelectModal] = useState<boolean>();
    const isFieldLocked = useMemo(() => isFieldFullyLocked(lockType), [lockType]);
    const title = 'Select Concept';

    const toggleSelectModal = useCallback(() => {
        setShowSelectModal(!showSelectModal);
    }, [showSelectModal, setShowSelectModal]);

    const onApply = useCallback(
        (selectedConcept: ConceptModel) => {
            onChange(id, selectedConcept);
            setShowSelectModal(false);
        },
        [onChange, id, setShowSelectModal]
    );

    return (
        <>
            <div className="domain-field-label">
                <DomainFieldLabel label="Ontology Concept" helpTipBody={getOntologyConceptAnnotationHelpTipBody()} />
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
                                        className={classNames("domain-annotation-item", isFieldLocked ? "domain-text-label" : "domain-validator-link")}
                                        onClick={isFieldLocked ? null : toggleSelectModal}
                                    >
                                        {concept?.getDisplayLabel() ?? principalConceptCode}
                                    </a>
                                </td>
                            </>
                        )}
                        <td className="content">
                            <ConceptOverviewTooltip concept={concept} error={error} />
                        </td>
                    </tr>
                </tbody>
            </table>
            {showSelectModal && (
                <OntologyBrowserModal
                    title={title}
                    initOntologyId={concept?.ontology}
                    onCancel={toggleSelectModal}
                    onApply={onApply}
                    successBsStyle={successBsStyle}
                    initConcept={concept}
                />
            )}
        </>
    );
});

function getOntologyConceptAnnotationHelpTipBody(): ReactNode {
    return (
        <>
            Select an ontology concept to use as an annotation for this field.
            <br />
            <br />
            Learn more about {helpLinkNode(ONTOLOGY_CONCEPT_TOPIC, 'ontology integration')} in LabKey.
        </>
    );
}
