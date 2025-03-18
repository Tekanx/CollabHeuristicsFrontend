import React from 'react'
import Header from './Header'


export default function MainLayout({children}) {
  return (
    <div>
        <Header/>
        <main>
            {children}
        </main>
        <footer>
            <p>@ 2025 CollabHeuristics</p>
        </footer>

    </div>
  )
}
