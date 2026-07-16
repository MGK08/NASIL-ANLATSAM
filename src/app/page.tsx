import Link from "next/link";
import { FaceMark } from "../components/FaceMark";

export default function Home() {
  return (
    <main className="screen screen--center">
      <FaceMark size={150} />
      <h1 className="wordmark">Nasıl<br />Anlatsam?</h1>
      <p className="tagline">Biliyorsun ama söyleyemiyorsun!</p>
      <div className="stack">
        <Link href="/kur" className="btn btn--primary">Oyun Kur</Link>
        <Link href="/katil" className="btn btn--ghost">Oyuna Katıl</Link>
      </div>
    </main>
  );
}
