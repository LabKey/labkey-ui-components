import * as React from 'react'

// A simple input field as a placeholder for a field that does something.
// Will require adding a parameter for the search action.
export class SearchBox extends React.Component<any, any> {
    render() {
        return (
            <input placeholder=" &#xF002; Enter search terms" className="placeholder-with-icons"/>
        )
    }
}