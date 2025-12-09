//Versioni finte di librerie problematiche che Jest usa automaticamente 
//nei test per far funzionare tutto
//React-router-dom v7 usa ESM (ES Modules) che Jest non riesce a caricare facilmente
//uso questo per semplificare i test
import React from 'react';

export const Link = ({ children, to, ...props }) => {
    return <a href={to} {...props}>{children}</a>;
};

export const useLocation = () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null
});

export const useNavigate = () => jest.fn();

export const useParams = () => ({});

export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const MemoryRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = () => null;
