import React, { FC, memo, useCallback, useState } from 'react';

import { Modal } from '../../Modal';
import { getSubmitButtonClass } from '../../app/utils';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { ConceptModel, PathModel } from './models';

interface OntologyBrowserModalProps {
    title: string;
    initOntologyId?: string;
    initConcept?: ConceptModel;
    initPath?: PathModel;
    onCancel: () => void;
    onApply: (path: PathModel, concept: ConceptModel) => void;
}

export const OntologyBrowserModal: FC<OntologyBrowserModalProps> = memo(props => {
    const { title, initOntologyId, onCancel, onApply, initConcept, initPath } = props;
    const [selectedPath, setSelectedPath] = useState<PathModel>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();
    const onConfirm = useCallback(() => {
        onApply(selectedPath, selectedConcept);
    }, [onApply, selectedPath, selectedConcept]);
    const onPathSelect = useCallback(
        (path: PathModel, concept: ConceptModel) => {
            setSelectedPath(path);
            setSelectedConcept(concept);
        },
        [setSelectedConcept, setSelectedPath]
    );

    return (
        <Modal
            bsSize="lg"
            canConfirm={selectedConcept !== undefined}
            confirmClass={`btn-${getSubmitButtonClass()}`}
            confirmText="Apply"
            onCancel={onCancel}
            onConfirm={onConfirm}
            title={title}
        >
            <OntologyBrowserPanel
                asPanel={false}
                initOntologyId={initOntologyId}
                initConcept={initConcept}
                initPath={initPath}
                onPathSelect={onPathSelect}
            />
        </Modal>
    );
});
