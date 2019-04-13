import * as React from 'react';
import renderer from 'react-test-renderer'

import { LoadingSpinner } from './LoadingSpinner'

describe("<LoadingSpinner />", () => {
    test("render without properties", () => {
       const tree = renderer.create(<LoadingSpinner />).toJSON();
       expect(tree).toMatchSnapshot();
    });

    test("render with text message", () => {
        const tree = renderer.create(<LoadingSpinner wrapperClassName="custom-class" msg="my message here"/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("render with react node message", () => {
        const messageNode = <div className="special-class">A div message</div>;
        const tree = renderer.create(<LoadingSpinner msg={messageNode}/>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});