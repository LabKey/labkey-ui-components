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
import React from 'react';
import { render } from '@testing-library/react';

import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from './FormStep';

interface OwnProps {
    step?: number;
    initialStep?: number;
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

describe('<FormStep/>', () => {
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
