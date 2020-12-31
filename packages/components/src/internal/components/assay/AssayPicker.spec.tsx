import React from 'react';
import { mount } from 'enzyme';
import {AssayPicker} from '../../..';

import renderer from "react-test-renderer";

describe('AssayPicker', () => {
    test('AssayPicker', () => {
        const composite = <AssayPicker
            showImport={true}
            onProviderSelect={jest.fn()}
            onContainerSelect={jest.fn()}
            onFileChange={jest.fn()}
            setIsFileUpload={jest.fn()}
        />;

        const tree = renderer.create(composite).toJSON();
        expect(tree).toMatchSnapshot();
    });


});
