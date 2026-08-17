/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from './FormStep';

interface OwnProps {
    initialStep?: number;
    step?: number;
}
type Props = OwnProps & WithFormStepsProps;

class FormStepTestImpl extends React.Component<Props> {
    componentDidMount(): void {
        if (this.props.step !== undefined) {
            this.props.selectStep(this.props.step);
        }
    }

    render() {
        return (
            <>
                <FormTabs tabs={['Tab 1', 'Tab 2']} />
                <FormStep stepIndex={1}>
                    <div>test0</div>
                </FormStep>
                <FormStep stepIndex={2}>
                    <div>test1</div>
                </FormStep>
            </>
        );
    }
}

const FormStepTest = withFormSteps(FormStepTestImpl, {
    currentStep: 1,
    furthestStep: 2,
    hasDependentSteps: true,
});

describe('FormStep', () => {
    test('default props', () => {
        const { container } = render(<FormStepTest />);
        const tabs = container.querySelectorAll('.form-step-tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0].classList.contains('active')).toBe(true);
        expect(tabs[0].classList.contains('disabled')).toBe(false);
        expect(tabs[1].classList.contains('active')).toBe(false);
        expect(tabs[1].classList.contains('disabled')).toBe(true);
        const steps = container.querySelectorAll('.form-step');
        expect(steps).toHaveLength(2);
        expect(steps[0].classList.contains('active')).toBe(true);
        expect(steps[1].classList.contains('active')).toBe(false);
    });

    test('currentStep', () => {
        const { container } = render(<FormStepTest step={2} />);
        const tabs = container.querySelectorAll('.form-step-tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0].classList.contains('active')).toBe(false);
        expect(tabs[1].classList.contains('active')).toBe(true);
        expect(tabs[1].classList.contains('disabled')).toBe(false);
        const steps = container.querySelectorAll('.form-step');
        expect(steps).toHaveLength(2);
        expect(steps[0].classList.contains('active')).toBe(false);
        expect(steps[1].classList.contains('active')).toBe(true);
    });

    test('initialStep', () => {
        const { container: container1 } = render(<FormStepTest />);
        const tabs1 = container1.querySelectorAll('.form-step-tab');
        expect(tabs1[0].classList.contains('active')).toBe(true);
        expect(tabs1[1].classList.contains('active')).toBe(false);

        const { container: container2 } = render(<FormStepTest initialStep={2} />);
        const tabs2 = container2.querySelectorAll('.form-step-tab');
        expect(tabs2[0].classList.contains('active')).toBe(false);
        expect(tabs2[1].classList.contains('active')).toBe(true);
    });
});

const STEP_COUNT = 4;

const NavigationTestImpl: FC<WithFormStepsProps> = props => {
    const { currentStep, furthestStep, nextStep, selectStep } = props;

    const onDoubleNext = useCallback(() => {
        nextStep();
        nextStep();
    }, [nextStep]);

    const onSelectStep = useCallback(
        (evt: React.MouseEvent<HTMLButtonElement>) => {
            selectStep(parseInt(evt.currentTarget.dataset.step, 10));
        },
        [selectStep]
    );

    return (
        <>
            <span data-testid="current-step">{currentStep}</span>
            <span data-testid="furthest-step">{furthestStep}</span>
            <button onClick={onDoubleNext} type="button">
                double next
            </button>
            {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map(step => (
                <button data-step={step} key={step} onClick={onSelectStep} type="button">
                    select {step}
                </button>
            ))}
            {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map(step => (
                <FormStep key={step} stepIndex={step}>
                    <div>step {step}</div>
                </FormStep>
            ))}
        </>
    );
};

const NavigationTest = withFormSteps(NavigationTestImpl);

describe('withFormSteps', () => {
    function expectState(currentStep: number, furthestStep: number): void {
        expect(screen.getByTestId('current-step')).toHaveTextContent(currentStep.toString());
        expect(screen.getByTestId('furthest-step')).toHaveTextContent(furthestStep.toString());
    }

    test('selectStep jumps ahead of furthestStep', async () => {
        const { container } = render(<NavigationTest />);
        expectState(1, 1);
        expect(container.querySelectorAll('.form-step')).toHaveLength(1);

        await userEvent.click(screen.getByText('select 3'));

        expectState(3, 3);
        // FormStep renders every step up to furthestStep, so selecting step 3 must not reveal step 4
        expect(container.querySelectorAll('.form-step')).toHaveLength(3);
    });

    test('selectStep does not lower furthestStep', async () => {
        render(<NavigationTest />);
        await userEvent.click(screen.getByText('select 4'));
        expectState(4, 4);

        await userEvent.click(screen.getByText('select 2'));
        expectState(2, 4);
    });

    test('selectStep ignores the current step', async () => {
        render(<NavigationTest />);
        await userEvent.click(screen.getByText('select 3'));
        expectState(3, 3);

        await userEvent.click(screen.getByText('select 3'));
        expectState(3, 3);
    });

    // The state updaters are functional, so batched calls compound rather than collapsing into one advance
    test('repeated nextStep in one handler advances once per call', async () => {
        render(<NavigationTest />);
        await userEvent.click(screen.getByText('double next'));
        expectState(3, 3);
    });
});
