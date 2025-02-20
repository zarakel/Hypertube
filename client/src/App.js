import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactPlayer from "react-player";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

        {/* video test */}
        <video width="320" height="240" controls>
          <source src="http://localhost:5001/testvideo" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* streaming test */}
        <ReactPlayer url="http://localhost:5001/streams/output.m3u8" controls />

      </header>
    </div>
  );
}

export default App;
