/*
 * Copyright (c) 2018 LabKey Corporation
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
import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { JSDOM } from 'jsdom'

// Enzyme expects an adapter to be configured
// http://airbnb.io/enzyme/docs/installation/react-16.html
configure({ adapter: new Adapter() });

// http://airbnb.io/enzyme/docs/guides/jsdom.html
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
    const props: any = Object.getOwnPropertyNames(src)
        .filter(prop => typeof target[prop] === 'undefined')
        .map(prop => Object.getOwnPropertyDescriptor(src, prop));
    Object.defineProperties(target, props);
}

global['window'] = window;
global['document'] = window.document;
global['navigator'] = {
    userAgent: 'node.js',
};
copyProps(window, global);