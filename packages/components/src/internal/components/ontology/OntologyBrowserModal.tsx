import React, { FC, memo, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';

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
    const onApplyClick = useCallback(() => {
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
        <Modal bsSize="large" show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <OntologyBrowserPanel
                    asPanel={false}
                    initOntologyId={initOntologyId}
                    initConcept={initConcept}
                    initPath={initPath}
                    onPathSelect={onPathSelect}
                />
            </Modal.Body>
            <Modal.Footer>
                <button
                    className="domain-adv-footer domain-adv-cancel-btn btn btn-default"
                    onClick={onCancel}
                    type="button"
                >
                    Cancel
                </button>
                <button
                    className={`domain-adv-footer domain-adv-apply-btn pull-right btn btn-${getSubmitButtonClass()}`}
                    disabled={!selectedConcept}
                    onClick={onApplyClick}
                    type="button"
                >
                    Apply
                </button>
            </Modal.Footer>
        </Modal>
    );
});
