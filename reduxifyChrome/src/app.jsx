import React from 'react';
import Rewind from './components/Rewind.jsx';
import LogEntry from './components/LogEntry.jsx';
import Graph from './components/Graph.jsx';
import D3UI from './components/D3UI';
import D3Actions from './components/D3Actions';
import D3Reducers from './components/D3Reducers';
import { UIHeadNode, actionsHeadNode, reducersHeadNode } from './../d3/basicTree';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      future: [],
      Actions: {},
      Reducers: {},
      UI: {},
    }
    // send a msg to the background script to ask for the current Log
    chrome.extension.sendMessage({type: 'populateLog'}, (response) => {
      // console.log('Initial Log Population: ', response.history);
      this.setState({
        UI: UIHeadNode,
        Actions: actionsHeadNode,
        Reducers: reducersHeadNode,
        history: response.history,
        future: response.future,
      });
    });

    // add a listener for new log Entries from the content script
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      // msg from content script with new history entry
      if (msg.type === 'addToLog') {
        // add to our local copy of the log and update State,
        // discarding any existing future
        const newHistory = this.state.history;
        // console.log('Got New Entry!');
        newHistory.push(msg.historyEntry);
        this.setState({
          history: newHistory,
          future: [],
        });
      }
    });
  }
  resetLog() {
    // send a message to the background script to reset its history
    chrome.extension.sendMessage({type: 'resetLog'}, (response) => {
      console.log('Log Reset.');
      this.setState({
        future: [],
        history: [],
      });
    });
  }
  undo() {
    // send a message to the content script to emit an undo DOM event
    chrome.extension.sendMessage({type: 'undoFromTool'}, (response) => {
      console.log('Undo Sent.');
      this.setState({
        history: this.state.history.slice(0, -1),
        future: this.state.history.slice(-1).concat(this.state.future),
      });
    });
  }
  redo() {
    // send a message to the content script to emit a redo DOM event
    chrome.extension.sendMessage({type: 'redoFromTool'}, (response) => {
      console.log('Redo Sent.');
      this.setState({
        history: this.state.history.concat(this.state.future.slice(0, 1)),
        future: this.state.future.slice(1),
      });
    });
  }
  render() {
    let diffs = [];
    if (this.state.history.length) {
      diffs = this.state.history[this.state.history.length - 1].diffs;
    }
    const historyEntries = this.state.history.map((historyEntry, index) => {
      return (<LogEntry key={index} index={index} entry={historyEntry} futury={false} present={index === this.state.history.length - 1}/>)
    });
    const futureEntries = this.state.future.map((futureEntry, index) => {
      return (<LogEntry key={index} index={index} entry={futureEntry} futury={true} present={false}/>)
    });
    return (
      <div>
        <h1>[seedux]</h1>
          <div>
          <D3UI UI = {this.state.UI} />
          <D3Actions Actions = {this.state.Actions} /> 
          <D3Reducers Reducers = {this.state.Reducers} />
        </div>
        <button onClick={() => this.resetLog()}>Reset Log</button>
        <button onClick={() => this.undo()}>Undo</button>
        <button onClick={() => this.redo()}>Redo</button>
        {historyEntries}
        <hr />
        {futureEntries}
      </div>
    )
  }
}

export default App;
