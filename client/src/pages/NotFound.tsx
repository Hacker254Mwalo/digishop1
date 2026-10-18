import { ArrowLeft, ArrowRight, Phone, Search } from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";

export default function NotFound() {
  return (
    <PublicShell>
      <main id="main-content" className="grid min-h-[55vh] place-items-center bg-[#f6f3ee] px-4 py-14 text-[#202a30]">
        <section className="w-full max-w-2xl rounded-[1.75rem] border border-[#d9d2c8] bg-white p-6 shadow-sm sm:p-10">
          <p className="font-mono text-sm font-bold text-[#a93823]">404 · PAGE NOT FOUND</p>
          <h1 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-4xl">That page is not here.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#56636a]">The address may have changed. Choose a service below or call the Siaya desk and we will help you find the right next step.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30] hover:bg-[#f6f3ee]"><ArrowLeft className="h-4 w-4" />Back to home</Link><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#b53d25]">Request a repair <ArrowRight className="h-4 w-4" /></Link><Link href="/spares" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30] hover:bg-[#f6f3ee]"><Search className="h-4 w-4" />Find parts</Link></div>
          <a href="tel:+254718114009" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#a93823]"><Phone className="h-4 w-4" />Call 0718 114 009</a>
        </section>
      </main>
    </PublicShell>
  );
}
