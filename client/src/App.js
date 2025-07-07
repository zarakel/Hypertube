import logo from './logo.svg';
import './App.css';
import VideoStreamPlayer from './VideoStreamPlayer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Hypertube</h1>
        <VideoStreamPlayer videoName="cosmos" />
      </header>
    </div>
  );
}

export default App;
