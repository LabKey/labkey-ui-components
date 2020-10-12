import React, { PureComponent, ComponentType } from 'react';
import { List } from 'immutable';

import { Button } from 'react-bootstrap';

import { Alert } from '../../..';

import { getDomainBottomErrorMessage, getDomainHeaderName, getUpdatedVisitedPanelsList } from './actions';
import { SEVERITY_LEVEL_ERROR } from './constants';

import { DomainDesign } from './models';

export interface InjectedBaseDomainDesignerProps {
    submitting: boolean;
    currentPanelIndex: number;
    visitedPanels: List<number>;
    validatePanel: number;
    firstState: boolean;
    setSubmitting: (submitting: boolean, callback?: () => any) => any;
    onTogglePanel: (index: number, collapsed: boolean, callback: () => any) => any;
    onFinish: (isValid: boolean, save: () => any) => any;
}

interface State {
    submitting: boolean;
    currentPanelIndex: number;
    visitedPanels: List<number>;
    validatePanel: number;
    firstState: boolean;
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

        onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
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

        onFinish = (isValid: boolean, save: () => any) => {
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

        setSubmitting = (submitting: boolean, callback?: () => any) => {
            this.setState(
                () => ({ submitting }),
                () => {
                    if (callback) {
                        callback();
                    }
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
    name: string;
    exception: string;
    domains: List<DomainDesign>;
    visitedPanels: List<number>;
    submitting: boolean;
    hasValidProperties: boolean;
    onCancel: () => void;
    onFinish: () => void;
    successBsStyle?: string;
    saveBtnText?: string;
}

export class BaseDomainDesigner extends React.PureComponent<BaseDomainDesignerProps, any> {
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
