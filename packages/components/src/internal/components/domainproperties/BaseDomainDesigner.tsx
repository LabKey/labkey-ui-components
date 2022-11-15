import React, { PureComponent, ComponentType } from 'react';
import { List } from 'immutable';

import { Button } from 'react-bootstrap';

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
        constructor(props: Props) {
            super(props);

            this.state = {
                submitting: false,
                currentPanelIndex: 0,
                visitedPanels: List<number>(),
                validatePanel: undefined,
                firstState: true,
            };
        }

        // TODO: having a child component pass a callback to a parent is a big red flag
        onTogglePanel = (index: number, collapsed: boolean, callback: () => any): void => {
            const { visitedPanels, currentPanelIndex } = this.state;
            const updatedVisitedPanels = getUpdatedVisitedPanelsList(visitedPanels, index);

            if (!collapsed) {
                this.setState(
                    () => ({
                        visitedPanels: updatedVisitedPanels,
                        currentPanelIndex: index,
                        firstState: false,
                        validatePanel: currentPanelIndex,
                    }),
                    callback()
                );
            } else {
                if (currentPanelIndex === index) {
                    this.setState(
                        () => ({
                            visitedPanels: updatedVisitedPanels,
                            currentPanelIndex: undefined,
                            firstState: false,
                            validatePanel: currentPanelIndex,
                        }),
                        callback()
                    );
                } else {
                    callback();
                }
            }
        };

        onFinish = (isValid: boolean, save: () => void): void => {
            const { visitedPanels, currentPanelIndex } = this.state;
            const updatedVisitedPanels = getUpdatedVisitedPanelsList(visitedPanels, currentPanelIndex);

            // This first setState forces the current expanded panel to validate its fields and display and errors
            // the callback setState then sets that to undefined so it doesn't keep validating every render
            this.setState(
                state => ({ validatePanel: state.currentPanelIndex, visitedPanels: updatedVisitedPanels }),
                () => {
                    this.setState(
                        () => ({ validatePanel: undefined }),
                        () => {
                            if (isValid) {
                                this.setSubmitting(true, save);
                            }
                        }
                    );
                }
            );
        };

        setSubmitting = (submitting: boolean, callback?: () => void): void => {
            this.setState(
                () => ({ submitting }),
                () => {
                    callback?.();
                }
            );
        };

        render() {
            const { submitting, currentPanelIndex, visitedPanels, firstState, validatePanel } = this.state;

            return (
                <ComponentToWrap
                    submitting={submitting}
                    currentPanelIndex={currentPanelIndex}
                    visitedPanels={visitedPanels}
                    validatePanel={validatePanel}
                    firstState={firstState}
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
            successBsStyle,
            submitting,
            onFinish,
            onCancel,
            hasValidProperties,
            saveBtnText,
        } = this.props;

        // get a list of the domain names that have errors
        const errorDomains = domains
            .filter(domain => {
                return domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR;
            })
            .map(domain => {
                return getDomainHeaderName(domain.name, undefined, name);
            })
            .toList();

        const bottomErrorMsg = getDomainBottomErrorMessage(exception, errorDomains, hasValidProperties, visitedPanels);

        return (
            <>
                {children}
                {bottomErrorMsg && (
                    <div className="domain-form-panel">
                        <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
                    </div>
                )}
                <div className="domain-form-panel domain-designer-buttons">
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        className="pull-right"
                        bsStyle={successBsStyle || 'success'}
                        disabled={submitting}
                        onClick={onFinish}
                    >
                        {saveBtnText}
                    </Button>
                </div>
            </>
        );
    }
}
