import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import TaskUPage from './pages/TaskUPage'
import BrowseGigsPage from './pages/BrowseGigsPage'
import GigDetailsPage from './pages/GigDetailsPage'
import AcceptedGigsPage from './pages/AcceptedGigsPage'
import PostGigPage from './pages/PostGigPage'
import PostedGigsPage from './pages/PostedGigsPage'
import MessagesPage from './pages/MessagesPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/tasku" element={<TaskUPage />} />
        <Route path="/tasku/browse" element={<BrowseGigsPage />} />
        <Route path="/tasku/gig/:id" element={<GigDetailsPage />} />
        <Route path="/tasku/accepted" element={<AcceptedGigsPage />} />
        <Route path="/tasku/post" element={<PostGigPage />} />
        <Route path="/tasku/posted" element={<PostedGigsPage />} />
        <Route path="/tasku/messages" element={<MessagesPage />} />
      </Routes>
    </Router>
  )
}

export default App
