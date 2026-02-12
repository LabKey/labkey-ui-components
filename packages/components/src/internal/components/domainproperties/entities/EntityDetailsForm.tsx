import React, { ChangeEvent } from 'react';
import { Map } from 'immutable';

import classNames from 'classnames';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { NameExpressionPreview } from '../NameExpressionPreview';

import { NameExpressionGenIdBanner, NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { IEntityDetails } from './models';
import { getEntityDescriptionValue, getEntityNameExpressionValue, getEntityNameValue, } from './actions';
import { ENTITY_FORM_IDS } from './constants';

import { InternalSpacesWarning } from '../../forms/InternalSpacesWarning';
import { Key } from '../../../../public/useEnterEscape';
import { buildURL } from '../../../url/AppURL';
import { Ajax, Utils } from '@labkey/api';
import { resolveErrorMessage } from '../../../util/messaging';

export interface EntityDetailsProps {
    data?: Map<string, any>;
    formValues?: IEntityDetails;
    nameExpressionErrors?: string[];
    nameExpressionChatResponse?: string;
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    namePreviewsLoading?: boolean;
    nameReadOnly?: boolean;
    noun: string;
    onFormChange: (evt: any) => any;
    onNameFieldHover?: () => any;
    previewName?: string;
    showPreviewName?: boolean;
    warning?: string;
}

export function sendNamingPatternPrompt(prompt: string, domainType?: string, rowId?: number): Promise<any> {
    return new Promise((resolve, reject) => {
        const url = buildURL('experiment', 'namingPatternChat.api');

        Ajax.request({
            url,
            method: 'POST',
            jsonData: {
                prompt,
                domainType,
                rowId,
            },
            success: Utils.getCallbackWrapper(response => {
                console.log('agent response', response);
                resolve(response?.suggestion ?? '');
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(resolveErrorMessage(error) ?? 'Failed to send prompt.');
            }),
        });
    });
}

interface State {
    chatResponse: string;
    promptText: string;
}

export class EntityDetailsForm extends React.PureComponent<EntityDetailsProps, State> {
    constructor(props: EntityDetailsProps) {
        super(props);
        this.state = {
            chatResponse: undefined,
            promptText: undefined,
        };
    }
    onKeyDown = async (event: React.KeyboardEvent<HTMLElement>): Promise<void> => {
        const isShift = event.shiftKey;
        if (!isShift && event.key == Key.ENTER) {
            console.log('Submitting request', this.state.promptText);
            const response = await sendNamingPatternPrompt(
                this.state.promptText,
                this.props.nameExpressionGenIdProps.kindName,
                this.props.nameExpressionGenIdProps.rowId
            );
            console.log('response is ', response);
            this.setState({ chatResponse: response });
        }
    };

    onPromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ promptText: event.target.value });
    };

    render() {
        const {
            nameExpressionInfoUrl,
            nameExpressionChatResponse,
            nameExpressionPlaceholder,
            noun,
            onFormChange,
            formValues,
            data,
            nameReadOnly,
            warning,
            showPreviewName,
            previewName,
            onNameFieldHover,
            namePreviewsLoading,
            nameExpressionGenIdProps,
            nameExpressionErrors,
        } = this.props;
        const { chatResponse } = this.state;
        const moreInfoLink = nameExpressionInfoUrl ? (
            <p>
                <a target="_blank" href={nameExpressionInfoUrl} rel="noopener noreferrer">
                    More info
                </a>
            </p>
        ) : (
            ''
        );

        return (
            <form>
                <div className="row margin-bottom margin-top">
                    <div className="col-xs-2">
                        <DomainFieldLabel label="Name" required={true} />
                    </div>
                    <div className="col-xs-10">
                        <input
                            className="form-control"
                            id={ENTITY_FORM_IDS.NAME}
                            type="text"
                            placeholder={`Enter a name for this ${noun.toLowerCase()}`}
                            onChange={onFormChange}
                            value={getEntityNameValue(formValues, data)}
                            disabled={nameReadOnly}
                        />
                    </div>
                    <div>
                        <div className="col-xs-2"></div>
                        <div className="col-xs-10">
                            <InternalSpacesWarning value={getEntityNameValue(formValues, data)} />
                        </div>
                    </div>
                </div>
                <div className="row margin-bottom">
                    <div className="col-xs-2">
                        <DomainFieldLabel
                            label="Description"
                            helpTipBody={`A short description for this ${noun.toLowerCase()}.`}
                        />
                    </div>
                    <div className="col-xs-10">
                        <textarea
                            className="form-control"
                            id={ENTITY_FORM_IDS.DESCRIPTION}
                            onChange={onFormChange}
                            value={getEntityDescriptionValue(formValues, data)}
                        />
                    </div>
                </div>
                {nameExpressionGenIdProps && (
                    <div className="row margin-top">
                        <div className="col-xs-2" />
                        <div className="col-xs-10">
                            <NameExpressionGenIdBanner {...nameExpressionGenIdProps} />
                        </div>
                    </div>
                )}
                <div className="row margin-bottom">
                    <div className="col-xs-2">
                        <div className="name-expression-label-div" onMouseEnter={() => onNameFieldHover?.()}>
                            <DomainFieldLabel
                                label="Naming Pattern"
                                helpTipBody={
                                    <>
                                        <p>Pattern used for generating unique IDs for this {noun.toLowerCase()}.</p>
                                        {showPreviewName && (
                                            <NameExpressionPreview
                                                chatHelp={nameExpressionChatResponse}
                                                errors={nameExpressionErrors}
                                                previewName={previewName}
                                                isPreviewLoading={namePreviewsLoading}
                                            />
                                        )}
                                        {moreInfoLink}
                                    </>
                                }
                            />
                        </div>
                    </div>
                    <div className="col-xs-10">
                        <input
                            className={classNames('form-control', {
                                'naming-pattern-border-warning':
                                    warning !== undefined && !warning.startsWith('Aliquot'),
                            })}
                            id={ENTITY_FORM_IDS.NAME_EXPRESSION}
                            type="text"
                            placeholder={nameExpressionPlaceholder}
                            onChange={onFormChange}
                            value={getEntityNameExpressionValue(formValues, data)}
                        />
                        <textarea
                            className="naming-pattern-chat-input form-control"
                            onChange={this.onPromptChange}
                            onKeyDown={this.onKeyDown}
                            placeholder="What kind of naming pattern do you want today?"
                        />
                        <div>{chatResponse}</div>
                    </div>
                </div>
            </form>
        );
    }
}
