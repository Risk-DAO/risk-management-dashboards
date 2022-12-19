import '@picocss/pico'
import { observer } from 'mobx-react'
import Footer from './layout/Footer'
import Sidenav from './layout/Sidenav'
import Header from './layout/Header'
import SinglePage from './pages/SinglePage'
import './themeSwitcher'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import React, { lazy, Suspense } from 'react'

const AlertsJson = lazy(() => import('./API/AlertsJson'))

class App extends React.Component {
    constructor(props) {
        super(props)
        this.scrollContainer = React.createRef()
    }

    render() {
        return (
            <Router>
                <div className="App">
                    <Header />
                    <div ref={this.scrollContainer} className="main-content">
                        <Sidenav />
                        <h1>Risk Management Dashboard</h1>
                        <main>
                            <Routes>
                                <Route
                                    exact
                                    strict
                                    path="/"
                                    element={<SinglePage scrollContainer={this.scrollContainer} />}
                                />
                                <Route
                                    exact
                                    strict
                                    path="/staging"
                                    element={<SinglePage scrollContainer={this.scrollContainer} />}
                                />
                                <Route
                                    exact
                                    strict
                                    path="/api/alerts"
                                    element={
                                        <Suspense fallback={<article aria-busy="true"></article>}>
                                            <AlertsJson />
                                        </Suspense>
                                    }
                                />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </div>
            </Router>
        )
    }
}

export default observer(App)
