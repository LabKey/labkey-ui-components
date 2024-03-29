import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptModel, PathModel } from './models';
import { fetchConceptForCode, fetchPathModel } from './actions';
import { ConceptOverviewTooltip } from './ConceptOverviewPanel';

interface Props {
    ontologyId: string;
    conceptSubtree: string;
    fieldLabel: string;
    fieldName?: string;
    fieldValue?: string;
    onConceptSelection: (concept: ConceptModel) => void;
}

export const OntologyConceptPicker: FC<Props> = memo((props: Props) => {
    const { ontologyId, conceptSubtree, fieldLabel, onConceptSelection, fieldValue = '' } = props;
    const [concept, setConcept] = useState<ConceptModel>();
    const [subtreePath, setSubtreePath] = useState<PathModel>();
    const [isLoadingSubtreePath, setIsLoadingSubtreePath] = useState<boolean>(!!conceptSubtree);
    const [showPicker, setShowPicker] = useState<boolean>(false);

    useEffect(() => {
        if (fieldValue) {
            fetchConceptForCode(fieldValue)
                .then(setConcept)
                .catch(() => {
                    // If concept not found clear existing concept, unfound values are allowed if not recommended
                    setConcept(undefined);
                });
        } else {
            setConcept(undefined);
        }
    }, [fieldValue]);

    useEffect(() => {
        if (conceptSubtree) {
            fetchPathModel(conceptSubtree)
                .then(pathModel => {
                    setSubtreePath(pathModel);
                    setIsLoadingSubtreePath(false);
                })
                .catch(() => {
                    setIsLoadingSubtreePath(false);
                });
        }
    }, [conceptSubtree]);

    const togglePicker = useCallback(() => {
        setShowPicker(!showPicker);
    }, [showPicker]);

    const onApplyConcept = useCallback(
        (selectedPath: PathModel, selectedConcept: ConceptModel) => {
            setConcept(selectedConcept);
            setShowPicker(false);
            onConceptSelection(selectedConcept);
        },
        [onConceptSelection]
    );

    const label = concept?.label ?? null;
    const title = `Find ${fieldLabel} By Tree`;

    if (isLoadingSubtreePath) {
        return null;
    }

    return (
        <>
            {!!label && (
                <div className="concept-label-text">
                    {label}
                    &nbsp;
                    <ConceptOverviewTooltip concept={concept} />
                </div>
            )}
            <div>
                <a className="show-toggle" onClick={togglePicker}>
                    {title}
                </a>
                {showPicker && (
                    <OntologyBrowserModal
                        initOntologyId={ontologyId}
                        initConcept={concept}
                        initPath={subtreePath}
                        onApply={onApplyConcept}
                        onCancel={togglePicker}
                        title={title}
                    />
                )}
            </div>
        </>
    );
});
