import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { getQueryGridModel } from '../../global';
import { getStateQueryGridModel } from '../../models';
import { gridInit } from '../../actions';
import { FormTabs, withFormSteps, WithFormStepsProps } from '../../..';
import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';
import { initUnitTestMocks } from '../../testHelperMocks';
import { AssayUploadTabs } from '../../constants';

import { RunDataPanel } from './RunDataPanel';

let MODEL_ID_NOT_LOADED;
let MODEL_ID_LOADED;

beforeAll(() => {
    initUnitTestMocks();

    let model = getStateQueryGridModel('jest-test-0', ASSAY_WIZARD_MODEL.queryInfo.schemaQuery, {
        editable: true,
        allowSelection: false,
        bindURL: false,
    });
    MODEL_ID_NOT_LOADED = model.getId();

    model = getStateQueryGridModel('jest-test-1', ASSAY_WIZARD_MODEL.queryInfo.schemaQuery, {
        editable: true,
        allowSelection: false,
        bindURL: false,
    });

    gridInit(model, false);
    MODEL_ID_LOADED = model.getId();
});

interface OwnProps {
    fullWidth?: boolean;
    allowBulkRemove?: boolean;
    showTabs?: boolean;
}
type Props = OwnProps & WithFormStepsProps;

class RunDataPanelWrapperImpl extends React.Component<Props, any> {
    render() {
        const { currentStep, fullWidth, allowBulkRemove, showTabs } = this.props;
        const gridModel = getQueryGridModel(MODEL_ID_LOADED);

        return (
            <RunDataPanel
                currentStep={currentStep}
                wizardModel={ASSAY_WIZARD_MODEL}
                gridModel={gridModel}
                onFileChange={jest.fn}
                onFileRemoval={jest.fn}
                onTextChange={jest.fn}
                fullWidth={fullWidth}
                allowBulkRemove={allowBulkRemove}
                showTabs={showTabs}
            />
        );
    }
}

const RunDataPanelWrapper = withFormSteps(RunDataPanelWrapperImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false,
});

describe('<RunDataPanel/>', () => {
    test('loading state based on gridModel', () => {
        const component = (
            <RunDataPanel
                currentStep={AssayUploadTabs.Files}
                wizardModel={ASSAY_WIZARD_MODEL}
                gridModel={getQueryGridModel(MODEL_ID_NOT_LOADED)}
                onFileChange={jest.fn}
                onFileRemoval={jest.fn}
                onTextChange={jest.fn}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('default props', () => {
        const component = <RunDataPanelWrapper />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom display props', () => {
        const component = <RunDataPanelWrapper allowBulkRemove={true} fullWidth={true} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('showsTabs', () => {
        let wrapper = mount(<RunDataPanelWrapper showTabs={true} />);
        expect(wrapper.find(FormTabs)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mount(<RunDataPanelWrapper showTabs={false} />);
        expect(wrapper.find(FormTabs)).toHaveLength(0);
        wrapper.unmount();
    });
});
