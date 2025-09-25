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
          padding: 2.5rem 1.5rem;
          background-color: var(--color-header-bg);
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .landingContainer {
          width: 100%;
          max-width: 60rem;
          margin: 0 auto;
          /* move content higher so it sits closer to header */
          margin-top: -4rem;
        }

        @media (min-width: 640px) {
          .landingContainer { margin-top: -5.5rem; }
        }

        .logo { display:block; margin:0 auto 1rem auto; width:140px; height:auto; }

        .landingTitle {
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 2.5rem;
          font-family: var(--font-heading);
          font-weight: var(--fw-regular);
          color: var(--color-heading);
        }

        .dashboardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .dashboardGrid { grid-template-columns: repeat(2, 1fr); }
        }

        .dashboardCard {
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background-color: white;
          padding: 1rem 1.5rem;
          text-align: center;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out;
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: var(--fw-medium);
          color: var(--color-primary);
          display: block;
        }

        .dashboardCard:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-color: var(--color-accent);
          color: var(--color-secondary);
        }
      `}</style>

      <div className="landingContainer">
        <h1 className="landingTitle">Choose a Dashboard</h1>
        <div className="dashboardGrid">
          <Link to="/admin" className="dashboardCard">Admin</Link>
          <Link to="/vendors" className="dashboardCard">Vendors</Link>
          <Link to="/accounts" className="dashboardCard">Accounts</Link>
          <Link to="/operations" className="dashboardCard">Operations</Link>
        </div>
      </div>
    </div>
  )
}

export default Landing


