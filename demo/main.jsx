import { createRoot } from 'react-dom/client';
import './main.css';

function App() {
    return (
        <div>
            <h1> Welcome to desi soundings!</h1>

            <ul>
                <li>
                    <a href="examples/stats/index.html">Sounding Stats Example</a>
                </li>
            </ul>
        </div>
    );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
