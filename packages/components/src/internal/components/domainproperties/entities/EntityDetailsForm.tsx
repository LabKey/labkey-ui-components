import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Map } from 'immutable';

import classNames from 'classnames';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { NameExpressionPreview } from '../NameExpressionPreview';

import { NameExpressionGenIdBanner, NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { IEntityDetails } from './models';
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
} from './actions';
import { ENTITY_FORM_IDS } from './constants';

export interface EntityDetailsProps {
    data?: Map<string, any>;
    formValues?: IEntityDetails;
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

export class EntityDetailsForm extends React.PureComponent<EntityDetailsProps, any> {
    render() {
        const {
            nameExpressionInfoUrl,
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
        } = this.props;
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
                        <FormControl
                            id={ENTITY_FORM_IDS.NAME}
                            type="text"
                            placeholder={`Enter a name for this ${noun.toLowerCase()}`}
                            onChange={onFormChange}
                            value={getEntityNameValue(formValues, data)}
                            disabled={nameReadOnly}
                        />
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
                        <FormControl
                            className={classNames({
                                'naming-pattern-border-warning':
                                    warning !== undefined && !warning.startsWith('Aliquot'),
                            })}
                            id={ENTITY_FORM_IDS.NAME_EXPRESSION}
                            type="text"
                            placeholder={nameExpressionPlaceholder}
                            onChange={onFormChange}
                            value={getEntityNameExpressionValue(formValues, data)}
                        />
                    </div>
                </div>
            </form>
        );
    }
}
