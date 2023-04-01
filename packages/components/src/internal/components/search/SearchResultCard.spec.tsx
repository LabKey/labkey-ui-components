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
import { mount } from 'enzyme';

import { SearchResultCard } from './SearchResultCard';

describe('<SearchResultCard/>', () => {
    test('category', () => {
        const summary = 'Card Summary';
        const category = 'My Category';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
        };
        const wrapper = mount(
            <SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />
        );

        // When there is no category or typeName the first card detail will be the summary
        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual(summary);

        wrapper.setProps({ cardData: { ...cardData, category } });
        expect(wrapper.find('.status-pill').text()).toEqual(category);
    });

    test('typeName', () => {
        const summary = 'Card Summary';
        const typeName = 'My Type';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
        };
        const wrapper = mount(
            <SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />
        );

        // When there is no category or typeName the first card detail will be the summary
        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual(summary);

        wrapper.setProps({ cardData: { ...cardData, typeName } });
        expect(wrapper.find('.status-pill').text()).toEqual(typeName);
    });

    test('icon', () => {
        const iconUrl = '/url/for/icon.png';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
        };
        const wrapper = mount(
            <SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />
        );
        expect(wrapper.find('img').getDOMNode().getAttribute('src')).toBe('/labkey/_images/testsource.svg');

        // The iconDir prop should override the _images/ default
        wrapper.setProps({ cardData: { ...cardData, iconDir: 'test/dir' } });
        expect(wrapper.find('img').getDOMNode().getAttribute('src')).toBe('/labkey/test/dir/testsource.svg');

        // The iconUrl prop should override the cardData.iconSrc attribute
        wrapper.setProps({ iconUrl });
        expect(wrapper.find('img').getDOMNode().getAttribute('src')).toBe(iconUrl);
    });

    test('summary', () => {
        const shortSummary = 'Short summary';
        const longSummary = 'This is a very long summary it should get truncated at some point';
        const wrapper = mount(<SearchResultCard cardData={{}} summary={undefined} url="#card" isTopResult={false} />);

        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual("No summary provided");

        wrapper.setProps({ summary: "" });
        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual("No summary provided");

        wrapper.setProps({ summary: shortSummary });
        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual(shortSummary);

        // Long summary should get truncated
        wrapper.setProps({ summary: longSummary });
        expect(wrapper.find('.search-result__summary').at(0).text()).toEqual(longSummary);
    });
});
