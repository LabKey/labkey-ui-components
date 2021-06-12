import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';

import { createFormInputName } from '../domainproperties/actions';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';
import { DomainField } from '../domainproperties/models';

import { ConceptOverviewTooltip } from './ConceptOverviewPanel';
import { ConceptModel, PathModel } from './models';
import { OntologyBrowserModal } from "./OntologyBrowserModal";

export interface OntologyConceptSelectButtonProps {
    id: string;
    field: DomainField;
    title?: string;
    concept: ConceptModel;
    conceptCode?: string;
    onChange: (id: string, path: PathModel, concept: ConceptModel) => void;
    successBsStyle?: string;
    error?: string;
    useFieldSourceOntology?: boolean;
}

export const OntologyConceptSelectButton: FC<OntologyConceptSelectButtonProps> = memo(props => {
    const { id, field, title, conceptCode, concept, onChange, error, successBsStyle, useFieldSourceOntology } = props;
    const isFieldLocked = useMemo(() => isFieldFullyLocked(field.lockType), [field.lockType]);
    const [showSelectModal, setShowSelectModal] = useState<boolean>();

    const toggleSelectModal = useCallback(() => {
        setShowSelectModal(!showSelectModal);
    }, [showSelectModal, setShowSelectModal]);

    const onApply = useCallback(
        (selectedPath: PathModel, selectedConcept: ConceptModel) => {
            onChange(id, selectedPath, selectedConcept);
            setShowSelectModal(false);
        },
        [onChange, id, setShowSelectModal]
    );

    const onRemove = useCallback(() => {
        onApply(undefined, undefined);
    }, [onApply]);

    return (
        <>
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
                        {!conceptCode && (
                            <td className="content">
                                <span className="domain-text-label">None Set</span>
                            </td>
                        )}
                        {conceptCode && (
                            <>
                                {!isFieldLocked && (
                                    <td className="content">
                                        <a className="domain-validator-link" onClick={onRemove}>
                                            <i className="fa fa-remove" />
                                        </a>
                                    </td>
                                )}
                                <td className="content">
                                    <a
                                        className={classNames(
                                            'domain-annotation-item',
                                            isFieldLocked ? 'domain-text-label' : 'domain-validator-link'
                                        )}
                                        onClick={isFieldLocked ? null : toggleSelectModal}
                                    >
                                        {concept?.getDisplayLabel() ?? conceptCode}
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
                    initOntologyId={concept?.ontology ?? (useFieldSourceOntology ? field.sourceOntology : undefined)}
                    onCancel={toggleSelectModal}
                    onApply={onApply}
                    successBsStyle={successBsStyle}
                    initConcept={concept}
                />
            )}
        </>
    );
});
