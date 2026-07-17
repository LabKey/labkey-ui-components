/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { FormStep, FormTabs, useFormStepActive, withFormSteps, WithFormStepsProps } from './FormStep';

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

    describe('useFormStepActive', () => {
        const ActiveProbe: FC<{ id: string }> = ({ id }) => {
            const active = useFormStepActive();
            return <div className={`probe-${id}`} data-active={active === undefined ? 'undefined' : String(active)} />;
        };
        ActiveProbe.displayName = 'ActiveProbe';

        class ActiveProbeImpl extends React.Component<WithFormStepsProps> {
            render() {
                return (
                    <>
                        <FormTabs tabs={['Tab 1', 'Tab 2']} />
                        <FormStep stepIndex={1}>
                            <ActiveProbe id="1" />
                        </FormStep>
                        <FormStep stepIndex={2}>
                            <ActiveProbe id="2" />
                        </FormStep>
                    </>
                );
            }
        }

        const ActiveProbeTest = withFormSteps(ActiveProbeImpl, {
            currentStep: 1,
            furthestStep: 2,
            hasDependentSteps: false,
        });

        const getActive = (id: string): string => document.querySelector(`.probe-${id}`).getAttribute('data-active');

        test('returns undefined outside of a FormStep', () => {
            render(<ActiveProbe id="none" />);
            expect(getActive('none')).toEqual('undefined');
        });

        test('flips as steps change, despite blocked re-renders of inactive steps', async () => {
            // FormStep keeps visited steps mounted (hidden via CSS) and ActiveStep blocks re-renders of inactive
            // step content via shouldComponentUpdate. FormButtons' modal footer slot behavior depends on context
            // updates reaching consumers anyway, so this test pins that semantic.
            const { container } = render(<ActiveProbeTest />);
            expect(getActive('1')).toEqual('true');
            expect(getActive('2')).toEqual('false');

            const tabs = container.querySelectorAll('.form-step-tab');
            await userEvent.click(tabs[1]);
            expect(getActive('1')).toEqual('false');
            expect(getActive('2')).toEqual('true');

            await userEvent.click(tabs[0]);
            expect(getActive('1')).toEqual('true');
            expect(getActive('2')).toEqual('false');
        });
    });

});
