import React, { FC, memo, useCallback, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { ConceptModel, PathModel } from './models';

interface OntologyBrowserModalProps {
    title: string;
    initOntologyId?: string;
    successBsStyle?: string;
    onCancel: () => void;
    onApply: (path: PathModel, concept: ConceptModel) => void;
    initConcept?: ConceptModel;
}

export const OntologyBrowserModal: FC<OntologyBrowserModalProps> = memo(props => {
    const { title, initOntologyId, successBsStyle, onCancel, onApply, initConcept } = props;
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
                    onPathSelect={onPathSelect}
                    initConcept={initConcept}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onCancel} className="domain-adv-footer domain-adv-cancel-btn">
                    Cancel
                </Button>
                <Button
                    className="domain-adv-footer domain-adv-apply-btn pull-right"
                    disabled={!selectedConcept}
                    onClick={onApplyClick}
                    bsStyle={successBsStyle}
                >
                    Apply
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

OntologyBrowserModal.defaultProps = {
    successBsStyle: 'success',
};
