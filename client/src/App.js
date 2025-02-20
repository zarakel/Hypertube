import logo from './logo.svg';
import './App.css';

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
        <video width="320" height="240" controls>
          <source src="http://localhost:5001/testvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </header>
    </div>
  );
}

export default App;
