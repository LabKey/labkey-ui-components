import React, { PureComponent, ComponentType } from 'react';
import { List } from 'immutable';

import { Button } from 'react-bootstrap';
import { FormButtons } from '../../FormButtons';

import { Alert } from '../base/Alert';

import { getDomainBottomErrorMessage, getDomainHeaderName, getUpdatedVisitedPanelsList } from './actions';
import { SEVERITY_LEVEL_ERROR } from './constants';

import { DomainDesign } from './models';

export interface InjectedBaseDomainDesignerProps {
    currentPanelIndex: number;
    firstState: boolean;
    onFinish: (isValid: boolean, save: () => void) => void;
    onTogglePanel: (index: number, collapsed: boolean, callback: () => void) => void;
    setSubmitting: (submitting: boolean, callback?: () => void) => void;
    submitting: boolean;
    validatePanel: number;
    visitedPanels: List<number>;
}

interface State {
    currentPanelIndex: number;
    firstState: boolean;
    submitting: boolean;
    validatePanel: number;
    visitedPanels: List<number>;
}

export function withBaseDomainDesigner<Props>(
    ComponentToWrap: ComponentType<Props & InjectedBaseDomainDesignerProps>
): ComponentType<Props> {
    class ComponentWithBaseDomainDesigner extends PureComponent<Props, State> {
        state: Readonly<State> = {
            currentPanelIndex: 0,
            firstState: true,
            submitting: false,
            visitedPanels: List<number>(),
            validatePanel: undefined,
        };

        // TODO: having a child component pass a callback to a parent is a big red flag
        onTogglePanel = (index: number, collapsed: boolean, callback: () => any): void => {
            const { currentPanelIndex } = this.state;

            if (!collapsed) {
                this.setState(
                    state => ({
                        currentPanelIndex: index,
                        firstState: false,
                        validatePanel: state.currentPanelIndex,
                        visitedPanels: getUpdatedVisitedPanelsList(state.visitedPanels, index),
                    }),
                    callback() // TODO: This is being called immediately and we rely on that fact. Refactor this whole toggling functionality.
                );
            } else if (currentPanelIndex === index) {
                this.setState(
                    state => ({
                        currentPanelIndex: undefined,
                        firstState: false,
                        validatePanel: state.currentPanelIndex,
                        visitedPanels: getUpdatedVisitedPanelsList(state.visitedPanels, index),
                    }),
                    callback() // TODO: This is being called immediately and we rely on that fact. Refactor this whole toggling functionality.
                );
            } else {
                callback();
            }
        };

        onFinish = (isValid: boolean, save: () => void): void => {
            // This first setState forces the current expanded panel to validate its fields and display and errors
            // the callback setState then sets that to undefined so it doesn't keep validating every render
            this.setState(
                state => {
                    const { currentPanelIndex, visitedPanels } = state;
                    return {
                        validatePanel: currentPanelIndex,
                        visitedPanels: getUpdatedVisitedPanelsList(visitedPanels, currentPanelIndex),
                    };
                },
                () => {
                    const nextState: Partial<State> = { validatePanel: undefined };
                    if (isValid) {
                        nextState.submitting = true;
                    }

                    this.setState(nextState as State, isValid ? save : undefined);
                }
            );
        };

        setSubmitting = (submitting: boolean, callback?: () => void): void => {
            this.setState({ submitting }, callback);
        };

        render() {
            return (
                <ComponentToWrap
                    {...this.state}
                    setSubmitting={this.setSubmitting}
                    onTogglePanel={this.onTogglePanel}
                    onFinish={this.onFinish}
                    {...(this.props as Props)}
                />
            );
        }
    }

    return ComponentWithBaseDomainDesigner;
}

interface BaseDomainDesignerProps {
    domains: List<DomainDesign>;
    exception: string;
    hasValidProperties: boolean;
    name: string;
    onCancel: () => void;
    onFinish: () => void;
    saveBtnText?: string;
    submitting: boolean;
    successBsStyle?: string;
    visitedPanels: List<number>;
}

export class BaseDomainDesigner extends PureComponent<BaseDomainDesignerProps> {
    static defaultProps = {
        saveBtnText: 'Save',
    };

    render() {
        const {
            children,
            domains,
            exception,
            name,
            visitedPanels,
            successBsStyle = 'success',
            submitting,
            onFinish,
            onCancel,
            hasValidProperties,
            saveBtnText,
        } = this.props;

        // get a list of the domain names that have errors
        const errorDomains = domains
            .filter(domain => domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR)
            .map(domain => getDomainHeaderName(domain.name, undefined, name))
            .toList();
        const bottomErrorMsg = getDomainBottomErrorMessage(exception, errorDomains, hasValidProperties, visitedPanels);
        const submitClassname = `btn btn-${successBsStyle}`;

        return (
            <>
                {children}
                {bottomErrorMsg && (
                    <div className="domain-form-panel">
                        <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
                    </div>
                )}
                <FormButtons>
                    <button className="btn btn-default" onClick={onCancel} type="button">
                        Cancel
                    </button>
                    <button className={submitClassname} disabled={submitting} onClick={onFinish} type="button">
                        {saveBtnText}
                    </button>
                </FormButtons>
            </>
        );
    }
}
