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
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

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
        const component = <FormStepTest />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('currentStep', () => {
        const component = <FormStepTest step={2} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('initialStep', () => {
        let wrapper = mount(<FormStepTest />);
        expect(wrapper.state('currentStep')).toBe(1);
        wrapper.unmount();

        wrapper = mount(<FormStepTest initialStep={2} />);
        expect(wrapper.state('currentStep')).toBe(2);
        wrapper.unmount();
    });
});
