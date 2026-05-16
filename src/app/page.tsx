import Image from "next/image";

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <div className="card">
        <h1>AtomQuest Portal</h1>
        <p>Welcome to the Atomberg In-House Goal Setting & Tracking Portal.</p>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-primary">Get Started</button>
          <button className="btn btn-secondary">Learn More</button>
        </div>
      </div>
    </main>
  );
}
