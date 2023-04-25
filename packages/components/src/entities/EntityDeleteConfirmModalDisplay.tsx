/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { PureComponent } from 'react';
import { Utils } from '@labkey/api';

import { isELNEnabled } from '../internal/app/utils';

import { capitalizeFirstChar } from '../internal/util/utils';
import { HelpLink } from '../internal/util/helpLinks';

import { EntityDataType, OperationConfirmationData } from '../internal/components/entities/models';
import { Alert } from '../internal/components/base/Alert';

import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export type EntityDeleteConfirmHandler = (rowsToDelete: any[], rowsToKeep: any[], userComment: string) => void;

interface Props {
    confirmationData: OperationConfirmationData;
    entityDataType: EntityDataType;
    getDeletionDescription?: (numToDelete: number) => React.ReactNode;
    onCancel: () => void;
    onConfirm: EntityDeleteConfirmHandler;
    verb?: string;
}

interface State {
    userComment: string;
}

/**
 * Displays the modal with a message about how many items can and cannot be deleted.
 * Note that the main reason this is a separate component is for testability.  When encompassed
 * within DeleteConfirmationModal, the jest tests do not render the component fully enough to test
 * different confirmation data scenarios.
 */
export class EntityDeleteConfirmModalDisplay extends PureComponent<Props, State> {
    static defaultProps = {
        verb: 'deleted',
    };

    getConfirmationProperties(): { canDelete: boolean; message: any; title: string } {
        const { confirmationData, entityDataType, verb, getDeletionDescription } = this.props;
        const { deleteHelpLinkTopic, nounSingular, nounPlural, dependencyText } = entityDataType;
        const capNounSingular = capitalizeFirstChar(nounSingular);
        const capNounPlural = capitalizeFirstChar(nounPlural);

        if (!confirmationData) return undefined;

        let _dependencyText;
        if (Utils.isFunction(dependencyText)) _dependencyText = (dependencyText as Function)();
        else {
            _dependencyText = isELNEnabled()
                ? (dependencyText ? dependencyText + ' or' : '') + ' references in one or more active notebooks'
                : dependencyText;
        }

        const numCanDelete = confirmationData.allowed.length;
        const numCannotDelete = confirmationData.notAllowed.length;
        const canDeleteNoun = numCanDelete === 1 ? capNounSingular : capNounPlural;
        const cannotDeleteNoun = numCannotDelete === 1 ? nounSingular : nounPlural;
        const totalNum = numCanDelete + numCannotDelete;
        const totalNoun = totalNum === 1 ? nounSingular : nounPlural;
        let text;
        if (totalNum === 0) {
            text =
                'Either no ' +
                nounPlural +
                ' are selected for deletion or the selected ' +
                nounPlural +
                ' are no longer valid.';
        } else if (numCannotDelete === 0) {
            if (getDeletionDescription) {
                text = getDeletionDescription(totalNum);
            } else {
                text = totalNum === 1 ? 'The selected ' : totalNum === 2 ? 'Both ' : 'All ' + totalNum + ' ';
                text += totalNoun + ' will be permanently ' + verb + '.';
            }
        } else if (numCanDelete === 0) {
            if (totalNum === 1) {
                text =
                    'The ' + totalNoun + " you've selected cannot be deleted because it has " + _dependencyText + '.  ';
            } else {
                text = numCannotDelete === 2 ? 'Neither of' : 'None of';
                text += ' the ' + totalNum + ' ' + totalNoun + " you've selected can be deleted";
                text += ' because they have ' + _dependencyText + '.';
            }
        } else {
            text = [];
            let firstText =
                "You've selected " +
                totalNum +
                ' ' +
                totalNoun +
                ' but only ' +
                numCanDelete +
                ' can be ' +
                verb +
                '. ';
            firstText += numCannotDelete + ' ' + cannotDeleteNoun + ' cannot be deleted because ';
            firstText += (numCannotDelete === 1 ? ' it has ' : ' they have ') + _dependencyText + '.';
            text.push(<React.Fragment key="commonText">{firstText}</React.Fragment>);
            if (getDeletionDescription)
                text.push(
                    <React.Fragment key="customText">
                        <br />
                        <br />
                        {getDeletionDescription(numCanDelete)}
                    </React.Fragment>
                );
        }
        const message = numCannotDelete ? (
            <Alert bsStyle="warning">
                {text}
                {deleteHelpLinkTopic && (
                    <>
                        &nbsp;(<HelpLink topic={deleteHelpLinkTopic}>more info</HelpLink>)
                    </>
                )}
            </Alert>
        ) : (
            <>{text}</>
        );

        return {
            message,
            title:
                numCanDelete > 0
                    ? 'Permanently Delete ' + numCanDelete + ' ' + canDeleteNoun + '?'
                    : totalNum === 1
                    ? 'Cannot Delete ' + capNounSingular
                    : 'No ' + capNounPlural + ' Can Be Deleted',
            canDelete: numCanDelete > 0,
        };
    }

    onConfirm = (userComment: string): void => {
        this.props.onConfirm?.(
            this.props.confirmationData.allowed,
            this.props.confirmationData.notAllowed,
            userComment
        );
    };

    render() {
        const { onCancel } = this.props;
        const { canDelete, message, title } = this.getConfirmationProperties();

        return (
            <DeleteConfirmationModal
                cancelButtonText={canDelete ? 'Cancel' : 'Dismiss'}
                confirmButtonText={canDelete ? 'Yes, Delete' : undefined}
                onCancel={onCancel}
                onConfirm={canDelete ? this.onConfirm : undefined}
                showDeleteComment={canDelete}
                title={title}
            >
                {message}
            </DeleteConfirmationModal>
        );
    }
}
