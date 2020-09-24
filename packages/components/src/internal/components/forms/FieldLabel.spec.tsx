/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import renderer from 'react-test-renderer';
import { mount, shallow } from 'enzyme';

import { QueryColumn } from '../base/models/model';

import { FieldLabel } from './FieldLabel';
import { LabelOverlay } from './LabelOverlay';

const queryColumn = QueryColumn.create({
    name: 'testColumn',
    caption: 'test Column',
});

describe('FieldLabel', () => {
    test("don't show label", () => {
        const tree = renderer.create(<FieldLabel showLabel={false} label="Label" />);
        expect(tree === null);
    });

    test('without overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        const wrapper = shallow(<FieldLabel withLabelOverlay={false} label={label} />);
        expect(wrapper.find('span.label-span')).toHaveLength(1);
        expect(wrapper.find(LabelOverlay)).toHaveLength(0);
    });

    test('without overlay, with column', () => {
        const wrapper = shallow(<FieldLabel withLabelOverlay={false} column={queryColumn} />);
        expect(wrapper.text()).toContain(queryColumn.caption);
        expect(wrapper.find(LabelOverlay)).toHaveLength(0);
    });

    test('with overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        const wrapper = shallow(<FieldLabel labelOverlayProps={label} />);
        expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    });

    test('with overlay, with column', () => {
        const wrapper = mount(<FieldLabel column={queryColumn} />);
        expect(wrapper.text()).toContain(queryColumn.caption);
        expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    });

    // TODO these tests fail with: TypeError: Cannot read property 'style' of null
    // This is somewhere inside the ReactBootstrapToggle element.
    // test("without overlay, allow disable", () => {
    //     const wrapper = renderer.create(
    //         <Formsy>
    //             <FieldLabel allowDisable={true} withLabelOverlay={false} column={queryColumn}/>
    //         </Formsy>).toJSON();
    //     // expect(wrapper.find(LabelOverlay)).toHaveLength(1);
    // });
    //
    // test("with overlay, allow disable", () => {
    //
    // });
});
