import { configure } from '@storybook/react'

function loadStories() {
    require('../src/stories/index.js');
    // require additional stories here
}

configure(loadStories, module);