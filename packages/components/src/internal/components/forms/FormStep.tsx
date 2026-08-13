/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, FC, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import classNames from 'classnames';

import { useEnterEscape } from '../../../public/useEnterEscape';

export interface WithFormStepsState {
    currentStep?: number;
    furthestStep?: number;
    hasDependentSteps?: boolean;
}

interface IFormStepContext extends Required<WithFormStepsState> {
    selectStep: (requestedStep?: number) => boolean;
}

const FormStepContext = React.createContext<IFormStepContext>(undefined);
const FormStepContextProvider = FormStepContext.Provider;

function useFormStepContext(): IFormStepContext | undefined {
    return useContext(FormStepContext);
}

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

export const FormStep: FC<FormStepProps> = props => {
    const { children, stepIndex, trackActive = true } = props;
    const context = useFormStepContext();

    if (!context) return null;

    const { currentStep, furthestStep } = context;
    const active = stepIndex === currentStep;

    if (furthestStep < stepIndex) return null;

    return (
        <div className={classNames('form-step', { active })}>
            <FormStepActiveContext.Provider value={active}>
                {trackActive ? <ActiveStep active={active}>{children}</ActiveStep> : children}
            </FormStepActiveContext.Provider>
        </div>
    );
};
FormStep.displayName = 'FormStep';

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
    onTabChange?: (stepIndex?: number) => void;
    tabs: string[];
}

export const FormTabs: FC<FormTabsProps> = ({ onTabChange, tabs }) => {
    const context = useFormStepContext();

    if (!context) return null;

    const { currentStep, furthestStep, hasDependentSteps, selectStep } = context;

    return (
        <div className="row">
            <div className="col-sm-12">
                <ul className="list-group clearfix" style={{ listStyle: 'none' }}>
                    {tabs.map((title, i) => {
                        const step = i + 1;
                        const disabled = hasDependentSteps ? step > currentStep : furthestStep < step;

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

export interface WithFormStepsProps extends Required<WithFormStepsState> {
    nextStep: () => void;
    previousStep: () => void;
    selectStep: (requestedStep?: number) => boolean;
}

export interface WithFormStepsOwnProps {
    initialStep?: number;
}

export const withFormSteps = <P extends WithFormStepsProps>(
    WrappedComponent: ComponentType<P>,
    defaultState?: WithFormStepsState
) => {
    type HOCProps = Omit<P, keyof WithFormStepsProps> & WithFormStepsOwnProps;

    const WithFormSteps: FC<HOCProps> = props => {
        const [state, setState] = useState<Required<WithFormStepsState>>(() => ({
            currentStep: props.initialStep ?? defaultState?.currentStep ?? 1,
            furthestStep: defaultState?.furthestStep ?? 1,
            hasDependentSteps: defaultState?.hasDependentSteps ?? true,
        }));

        const nextStep = useCallback((): void => {
            setState(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1,
                furthestStep: prev.currentStep + 1 >= prev.furthestStep ? prev.currentStep + 1 : prev.furthestStep,
            }));
        }, []);

        const previousStep = useCallback((): void => {
            setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
        }, []);

        const selectStep = useCallback(
            (requestedStep?: number): boolean => {
                if (requestedStep !== undefined && state.currentStep !== requestedStep) {
                    setState(prev => ({
                        ...prev,
                        currentStep: requestedStep,
                        furthestStep: requestedStep >= prev.furthestStep ? requestedStep : prev.furthestStep,
                    }));
                    return true;
                }
                return false;
            },
            [state.currentStep]
        );

        const context = useMemo<IFormStepContext>(() => ({ ...state, selectStep }), [selectStep, state]);

        return (
            <FormStepContextProvider value={context}>
                <WrappedComponent
                    {...(props as unknown as P)}
                    {...state}
                    nextStep={nextStep}
                    previousStep={previousStep}
                    selectStep={selectStep}
                />
            </FormStepContextProvider>
        );
    };

    WithFormSteps.displayName = `withFormSteps(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithFormSteps;
};
