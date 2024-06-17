import {
    LocationProvider,
    Router,
    Route,
    hydrate,
    prerender as ssr,
} from 'preact-iso';
import { Header } from './components/Header.jsx';
import { Home } from './pages/Home/index.jsx';
import { ContractOwner } from './pages/Contract/owner.jsx';
import { ContractUser } from './pages/Contract/user.jsx';
import { Settings } from './pages/Settings/index.jsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';
import 'flowbite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LocationProvider>
                <Header />
                <main>
                    <Router>
                        <Route path='/' component={Home} />
                        <Route
                            path='/contract/owner'
                            component={ContractOwner}
                        />
                        <Route path='/contract/user' component={ContractUser} />
                        <Route path='/settings' component={Settings} />
                        <Route default component={NotFound} />
                    </Router>
                </main>
            </LocationProvider>
        </QueryClientProvider>
    );
}

if (typeof window !== 'undefined') {
    hydrate(<App />, document.getElementById('app')!);
}

export async function prerender(data: Record<string, unknown>) {
    return await ssr(<App {...data} />);
}
