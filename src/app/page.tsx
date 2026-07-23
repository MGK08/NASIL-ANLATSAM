import Link from "next/link";
import { FaceMark } from "../components/FaceMark";
import { Splash } from "../components/Splash";

export default function Home() {
  return (
    <>
      <Splash />
      <main className="screen screen--center">
        <FaceMark size={150} />
        <h1 className="wordmark">Nasıl<br />Anlatsam?</h1>
        <p className="tagline">Biliyorsun ama söyleyemiyorsun!</p>
        <div className="stack">
          <Link href="/kur" className="btn btn--primary">Oyun Kur</Link>
          <Link href="/katil" className="btn btn--ghost">Oyuna Katıl</Link>
        </div>
        <Link href="/gizlilik" style={{
          marginTop: 18, fontFamily: "var(--body)", fontWeight: 700, fontSize: 12.5,
          color: "rgba(255,247,239,0.85)", textDecoration: "underline",
        }}>
          Gizlilik Politikası
        </Link>
      </main>
    </>
  );
}
