import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';

import { createFormInputName } from '../domainproperties/utils';
import { DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT } from '../domainproperties/constants';
import { isFieldFullyLocked } from '../domainproperties/propertiesUtil';
import { DomainField } from '../domainproperties/models';

import { ConceptOverviewTooltip } from './ConceptOverviewPanel';
import { ConceptModel, PathModel } from './models';
import { OntologyBrowserModal } from './OntologyBrowserModal';
import { fetchConceptForCode, fetchPathModel } from './actions';

export interface OntologyConceptSelectButtonProps {
    error?: string;
    field: DomainField;
    id: string;
    onChange: (id: string, path: PathModel, concept: ConceptModel) => void;
    title?: string;
    useFieldSourceOntology?: boolean;
    valueIsPath: boolean;
    valueProp: string;
}

export const OntologyConceptSelectButton: FC<OntologyConceptSelectButtonProps> = memo(props => {
    const { id, field, title, onChange, error, useFieldSourceOntology, valueProp, valueIsPath } = props;
    const isFieldLocked = useMemo(() => isFieldFullyLocked(field.lockType), [field.lockType]);
    const [showSelectModal, setShowSelectModal] = useState<boolean>();
    const [concept, setConcept] = useState<ConceptModel>();
    const [path, setPath] = useState<PathModel>();
    const fieldValue = useMemo(() => field[valueProp], [field]);

    useEffect(() => {
        if (valueIsPath) {
            if (fieldValue) {
                fetchPathModel(fieldValue)
                    .then(setPath)
                    .catch(err => {
                        console.error('Failed to fetch path model', err);
                    });
            } else {
                setPath(undefined);
            }
        }
    }, [fieldValue]);

    useEffect(() => {
        if (!valueIsPath && fieldValue) {
            fetchConceptForCode(fieldValue)
                .then(setConcept)
                .catch(err => {
                    console.error('Failed to fetch concept for code', err);
                });
        } else if (path?.code) {
            fetchConceptForCode(path.code)
                .then(setConcept)
                .catch(err => {
                    console.error('Failed to fetch concept for code', err);
                });
        } else {
            setConcept(undefined);
        }
    }, [fieldValue, path]);

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
                        {!fieldValue && (
                            <td className="content">
                                <span className="domain-text-label">None Set</span>
                            </td>
                        )}
                        {fieldValue && (
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
                                        onClick={isFieldLocked ? undefined : toggleSelectModal}
                                    >
                                        {concept ? concept.getDisplayLabel() : path?.getDisplayLabel() ?? fieldValue}
                                    </a>
                                </td>
                            </>
                        )}
                        <td className="content">
                            <ConceptOverviewTooltip concept={concept} path={path} error={error} />
                        </td>
                    </tr>
                </tbody>
            </table>
            {showSelectModal && (
                <OntologyBrowserModal
                    title={title}
                    initOntologyId={concept?.ontology ?? (useFieldSourceOntology ? field.sourceOntology : undefined)}
                    initConcept={path ? undefined : concept} // if we have a path, we want the modal to use that instead of the first path from the concept
                    initPath={path}
                    onCancel={toggleSelectModal}
                    onApply={onApply}
                />
            )}
        </>
    );
});
