import { useState } from 'react';
import './App.css';

function App() {
	const [count, setCount] = useState(0);

	return (
		<div className='App'>
			<header className='App-header'>
				<h1>SwissGrid</h1>
				<p>A minimal monorepo application</p>
				<div className='card'>
					<button onClick={() => setCount((count) => count + 1)}>
						count is {count}
					</button>
					<p>Built with React 18 + Vite + TypeScript</p>
				</div>
			</header>
		</div>
	);
}

export default App;
