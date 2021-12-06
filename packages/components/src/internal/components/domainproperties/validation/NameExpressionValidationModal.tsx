import React from 'react';

import { ConfirmModal } from '../../../..';

export interface Props {
    title?: string;
    warnings: string[];
    show: boolean;
    onHide: () => any;
    onConfirm: () => any;
}

const nameExpressionWarningPrefix = "Name Expression warning: ";
const aliquotNameExpressionWarningPrefix = "Aliquot Name Expression warning: ";

export class NameExpressionValidationModal extends React.PureComponent<Props> {

        onConfirm = () => {
            const { onConfirm, onHide } = this.props;
            onConfirm();
            onHide();
        };

        render() {
            const { title, onHide, onConfirm, warnings, show } = this.props;

            if (!show || !warnings || warnings.length === 0)
                return null;

            const nameWarnings = [], aliquotNameWarnings = [];
            warnings?.forEach(error => {
                if (error.indexOf(nameExpressionWarningPrefix) === 0)
                    nameWarnings.push(error.substring(nameExpressionWarningPrefix.length));
                else if (error.indexOf(aliquotNameExpressionWarningPrefix) === 0)
                    aliquotNameWarnings.push(error.substring(aliquotNameExpressionWarningPrefix.length));
            });

            let warnTitle = title, hasMultiGroup = false;
            if (!warnTitle) {
                if (nameWarnings.length > 0 && aliquotNameWarnings.length > 0) {
                    hasMultiGroup = true;
                    warnTitle = 'Sample and Aliquot Naming Expression Warning(s)';
                }
                else if (nameWarnings.length > 0)
                    warnTitle = 'Naming Expression Warning(s)';
                else if (aliquotNameWarnings.length > 0)
                    warnTitle = 'Aliquot Naming Expression Warning(s)';
            }

            let nameWarnDisplay = null, aliquotNameWarnDisplay = null;
            if (nameWarnings.length > 0) {
                nameWarnDisplay = <div>
                    {hasMultiGroup && <p>Naming Expression Warning(s):</p>}
                    <ul className="name-expression-warning-list">
                        {React.Children.map(nameWarnings, warning => (
                            <li>{warning}</li>
                        ))}
                    </ul>
                    <br/>
                </div>;
            }
            if (aliquotNameWarnings.length > 0) {
                aliquotNameWarnDisplay = <div>
                    {hasMultiGroup && <p>Aliquot Naming Expression Warning(s):</p>}
                    <ul className="aliquot-expression-warning-list">
                        {React.Children.map(aliquotNameWarnings, warning => (
                            <li>{warning}</li>
                        ))}
                    </ul>
                </div>;
            }


            return (
                <ConfirmModal
                    title={warnTitle}
                    onCancel={onHide}
                    onConfirm={onConfirm}
                    confirmButtonText="Save anyways..."
                    confirmVariant="danger"
                    cancelButtonText="Cancel"
                >
                    {nameWarnDisplay}
                    {aliquotNameWarnDisplay}
                </ConfirmModal>
            );
        }

}
