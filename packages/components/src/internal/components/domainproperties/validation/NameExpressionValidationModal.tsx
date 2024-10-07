import React from 'react';

import { Modal } from '../../../Modal';

export interface Props {
    onConfirm: () => any;
    onHide: () => any;
    previews: string[];
    show: boolean;
    title?: string;
    warnings: string[];
}

const nameExpressionWarningPrefix = 'Name Pattern warning: ';
const aliquotNameExpressionWarningPrefix = 'Aliquot Name Pattern warning: ';

export class NameExpressionValidationModal extends React.PureComponent<Props> {
    onConfirm = () => {
        const { onConfirm, onHide } = this.props;
        onConfirm();
        onHide();
    };

    render() {
        const { title, onHide, onConfirm, warnings, show, previews } = this.props;

        if (!show || !warnings || warnings.length === 0) return null;

        const nameWarnings = [],
            aliquotNameWarnings = [];
        warnings?.forEach(warning => {
            if (warning.indexOf(nameExpressionWarningPrefix) === 0)
                nameWarnings.push(warning.substring(nameExpressionWarningPrefix.length));
            else if (warning.indexOf(aliquotNameExpressionWarningPrefix) === 0)
                aliquotNameWarnings.push(warning.substring(aliquotNameExpressionWarningPrefix.length));
        });

        let warnTitle = title,
            hasMultiGroup = false;
        if (!warnTitle) {
            if (nameWarnings.length > 0 && aliquotNameWarnings.length > 0) {
                hasMultiGroup = true;
                warnTitle = 'Sample and Aliquot Naming Pattern Warning(s)';
            } else if (nameWarnings.length > 0) warnTitle = 'Naming Pattern Warning(s)';
            else if (aliquotNameWarnings.length > 0) warnTitle = 'Aliquot Naming Pattern Warning(s)';
        }

        let nameWarnDisplay = null,
            aliquotNameWarnDisplay = null;
        if (nameWarnings.length > 0) {
            nameWarnDisplay = (
                <div>
                    {hasMultiGroup && <p>Naming Pattern Warning(s):</p>}
                    <p>Example name generated: {previews[0]}</p>
                    <ul className="name-expression-warning-list">
                        {nameWarnings.map((warning, ind) => (
                            <li key={ind + ''}>{warning}</li>
                        ))}
                    </ul>
                    <br />
                </div>
            );
        }
        if (aliquotNameWarnings.length > 0) {
            aliquotNameWarnDisplay = (
                <div>
                    {hasMultiGroup && <p>Aliquot Naming Pattern Warning(s):</p>}
                    <p>Example aliquot name generated: {previews[1]}</p>
                    <ul className="aliquot-expression-warning-list">
                        {aliquotNameWarnings.map((warning, ind) => (
                            <li key={ind + ''}>{warning}</li>
                        ))}
                    </ul>
                </div>
            );
        }

        return (
            <Modal
                title={warnTitle}
                onCancel={onHide}
                onConfirm={onConfirm}
                confirmText="Save anyway"
                confirmClass="btn-danger"
            >
                {nameWarnDisplay}
                {aliquotNameWarnDisplay}
            </Modal>
        );
    }
}
