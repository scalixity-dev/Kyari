import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing">
      <style>{`
        /* Inlined from Landing.module.css - uses project CSS variables from index.css */
        :root { }

        /* Ensure root width unaffected by container constraints */
        #root {
          width: 100% !important;
          max-width: none !important;
        }

        .landing {
          display: flex;
          width: 100%;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.25rem;
          background-color: var(--color-header-bg);
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .landingContainer {
          width: 100%;
          max-width: 72rem;
          margin: 0 auto;
          /* move content higher so it sits closer to header */
          margin-top: -3.5rem;
          padding: 0 0.25rem;
        }

        @media (min-width: 640px) {
          .landingContainer { margin-top: -4.5rem; }
        }

        .logo { display:block; margin:0 auto 1rem auto; width:128px; height:auto; }

        /* Fluid / responsive heading */
        .landingTitle {
          margin-bottom: 1rem;
          text-align: center;
          font-size: clamp(1.5rem, 1rem + 3.5vw, 2.75rem);
          line-height: 1.05;
          font-family: var(--font-heading);
          font-weight: var(--fw-regular);
          color: var(--color-heading);
          padding: 0 0.5rem;
        }

        .dashboardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }

        /* Tablet: 2 columns */
        @media (min-width: 640px) {
          .dashboardGrid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        }

        /* Desktop / large screens: 4 columns */
        @media (min-width: 1024px) {
          .dashboardGrid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        }

        .dashboardCard {
          border-radius: 0.75rem;
          border: 1px solid rgba(229,231,235,0.9);
          background-color: white;
          padding: 1rem 1rem;
          text-align: center;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out, transform 0.12s ease;
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: var(--fw-medium);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 56px; /* comfortable touch target */
          cursor: pointer;
        }

        .dashboardCard:focus,
        .dashboardCard:focus-visible {
          outline: 3px solid rgba(34,197,94,0.15);
          outline-offset: 3px;
        }

        .dashboardCard:hover {
          box-shadow: 0 6px 12px -4px rgba(0,0,0,0.12);
          border-color: var(--color-accent);
          color: var(--color-secondary);
          transform: translateY(-2px);
        }

        /* Slightly larger text on bigger screens */
        @media (min-width: 640px) {
          .dashboardCard { padding: 1.25rem 1.25rem; min-height: 64px; }
        }

        @media (min-width: 1024px) {
          .dashboardCard { padding: 1.5rem 1.5rem; min-height: 72px; }
        }

        /* Make the whole card clickable on touch devices */
        .dashboardCard > * { pointer-events: none; }
      `}</style>

      <div className="landingContainer">
        <h1 className="landingTitle">Choose a Dashboard</h1>
        <div className="dashboardGrid">
          <Link to="/admin" className="dashboardCard" aria-label="Go to Admin dashboard">Admin</Link>
          <Link to="/vendors" className="dashboardCard" aria-label="Go to Vendors dashboard">Vendors</Link>
          <Link to="/accounts" className="dashboardCard" aria-label="Go to Accounts dashboard">Accounts</Link>
          <Link to="/operations" className="dashboardCard" aria-label="Go to Operations dashboard">Operations</Link>
        </div>
      </div>
    </div>
  )
}

export default Landing


