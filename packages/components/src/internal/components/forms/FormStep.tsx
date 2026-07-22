/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode, useCallback, useContext } from 'react';
import classNames from 'classnames';

import { useEnterEscape } from '../../../public/useEnterEscape';

interface IFormStepContext {
    currentStep?: number;
    furthestStep?: number;
    hasDependentSteps?: boolean;
    selectStep?: (requestedStep?: number) => boolean;
}

const FormStepContext = React.createContext<IFormStepContext>(undefined);
const FormStepContextProvider = FormStepContext.Provider;
const FormStepContextConsumer = FormStepContext.Consumer;

export const FormStepActiveContext = React.createContext<boolean>(true);

export function useFormStepActive(): boolean {
    return useContext(FormStepActiveContext);
}

interface ActiveStepProps extends PropsWithChildren {
    active?: boolean;
}

class ActiveStep extends React.Component<ActiveStepProps, any> {
    static defaultProps = {
        active: true,
    };

    shouldComponentUpdate(nextProps: ActiveStepProps) {
        return nextProps.active;
    }

    render() {
        return this.props.children;
    }
}

interface FormStepProps extends PropsWithChildren {
    stepIndex: number;
    trackActive?: boolean;
}

export class FormStep extends React.Component<FormStepProps, any> {
    static defaultProps = {
        trackActive: true,
    };

    render() {
        const { children, stepIndex, trackActive } = this.props;

        return (
            <FormStepContextConsumer>
                {(context: IFormStepContext) => {
                    if (!context) return null;

                    const { currentStep, furthestStep } = context;
                    const active = stepIndex === currentStep;

                    if (furthestStep >= stepIndex) {
                        return (
                            <div className={classNames('form-step', { active })}>
                                <FormStepActiveContext.Provider value={active}>
                                    {trackActive ? <ActiveStep active={active}>{children}</ActiveStep> : children}
                                </FormStepActiveContext.Provider>
                            </div>
                        );
                    }

                    return null;
                }}
            </FormStepContextConsumer>
        );
    }
}

interface FormTabItemProps {
    active: boolean;
    disabled: boolean;
    onTabChange?: (stepIndex?: number) => any;
    selectStep: (requestedStep?: number) => boolean;
    step: number;
    title: string;
}

const FormTabItem: FC<FormTabItemProps> = ({ active, disabled, onTabChange, selectStep, step, title }) => {
    const onSelectStep = useCallback(() => {
        if (selectStep(step) !== false && onTabChange) {
            onTabChange(step);
        }
    }, [onTabChange, selectStep, step]);

    const onKeyDown = useEnterEscape(disabled ? undefined : onSelectStep);

    return (
        <li
            className={classNames('list-group-item form-step-tab', { active, disabled })}
            onClick={disabled ? undefined : onSelectStep}
            onKeyDown={onKeyDown}
            tabIndex={disabled ? undefined : 0}
        >
            {title}
        </li>
    );
};
FormTabItem.displayName = 'FormTabItem';

interface FormTabsProps {
    onTabChange?: (stepIndex?: number) => any;
    tabs: string[];
}

export const FormTabs: FC<FormTabsProps> = ({ onTabChange, tabs }) => {
    const context = useContext(FormStepContext);
    if (!context) return null;
    const { currentStep, furthestStep, hasDependentSteps, selectStep } = context;

    return (
        <div className="row">
            <div className="col-sm-12">
                <ul className="list-group clearfix" style={{ listStyle: 'none' }}>
                    {tabs.map((title, i) => {
                        const step = i + 1;
                        const disabled =
                            furthestStep === undefined
                                ? true
                                : hasDependentSteps
                                  ? step > currentStep
                                  : furthestStep < step;

                        return (
                            <FormTabItem
                                active={currentStep === step}
                                disabled={disabled}
                                key={step}
                                onTabChange={onTabChange}
                                selectStep={selectStep}
                                step={step}
                                title={title}
                            />
                        );
                    })}
                </ul>
                <div className="clearfix" />
            </div>
        </div>
    );
};
FormTabs.displayName = 'FormTabs';

export interface WithFormStepsState {
    currentStep?: number;
    furthestStep?: number;
    hasDependentSteps?: boolean;
    selectStep?: (requestedStep?: number) => boolean;
}

export interface WithFormStepsProps extends WithFormStepsState {
    initialStep?: number;
    nextStep: () => any;
    previousStep: () => any;
}

// FIXME: this wrapper obliterates all type information for wrapped components, making it unsafe
export const withFormSteps = (Component: any, defaultState?: WithFormStepsState) =>
    class WithFormSteps extends React.Component<any, any> {
        constructor(props) {
            super(props);
            this.state = {
                currentStep: props.initialStep
                    ? props.initialStep
                    : defaultState && defaultState.currentStep !== undefined
                      ? defaultState.currentStep
                      : 1,
                furthestStep: defaultState && defaultState.furthestStep !== undefined ? defaultState.furthestStep : 1,
                hasDependentSteps:
                    defaultState && defaultState.hasDependentSteps !== undefined
                        ? defaultState.hasDependentSteps
                        : true,
                selectStep: this.selectStep,
            };
        }

        nextStep = (): void => {
            const { currentStep, furthestStep } = this.state;

            this.setState({
                currentStep: currentStep + 1,
                furthestStep: currentStep + 1 >= furthestStep ? currentStep + 1 : furthestStep,
            });
        };

        previousStep = (): void => {
            const { currentStep } = this.state;

            this.setState({
                currentStep: currentStep - 1,
            });
        };

        selectStep = (requestedStep?: number): boolean => {
            const { currentStep, furthestStep } = this.state;

            if (furthestStep >= requestedStep && currentStep !== requestedStep) {
                this.setState({
                    currentStep: requestedStep,
                });

                return true;
            }

            return false;
        };

        render(): ReactNode {
            return (
                <FormStepContextProvider value={this.state}>
                    <Component
                        {...this.props}
                        {...this.state}
                        nextStep={this.nextStep}
                        previousStep={this.previousStep}
                        selectStep={this.selectStep}
                    />
                </FormStepContextProvider>
            );
        }
    };
