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
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { enableMapSet, enablePatches } from 'immer';

// Enzyme expects an adapter to be configured
// http://airbnb.io/enzyme/docs/installation/react-16.html
configure({ adapter: new Adapter() });

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

// This silences errors related to our Page component using window.scrollTo. JSDom doesn't implement scrollTo, but that
// is ok, we aren't testing that behavior.
const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });
Object.defineProperty(window, '__react-beautiful-dnd-disable-dev-warnings', { value: true, writable: false });
