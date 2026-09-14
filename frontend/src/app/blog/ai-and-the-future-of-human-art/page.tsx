import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/blog';
import { breadcrumbJsonLd } from '@/lib/seo';

const SLUG = 'ai-and-the-future-of-human-art';
const CANONICAL = `${SITE}/blog/${SLUG}`;
const PUBLISHED = '2026-09-14';

export const metadata: Metadata = {
  title: 'AI and the Future of Human Art',
  description:
    'AI can now generate images in seconds. What does that mean for artists’ income, copyright and livelihoods — and why human-made art matters more than ever.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'AI and the Future of Human Art — KalaCUBE',
    description:
      'Income, copyright, displacement — an honest look at AI and human artists, and why platforms that back real makers matter.',
    url: CANONICAL,
    type: 'article',
    publishedTime: PUBLISHED,
  },
  keywords: [
    'AI and artists',
    'AI art copyright',
    'AI impact on artists income',
    'human-made art',
    'artists in the AI age',
    'AI training data lawsuits',
    'support human artists',
    'original Indian art',
  ],
};

// A curated, non-spammy set of sister-brand essays on the same 2026 moment.
const NETWORK: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: 'https://netavon.com/blog/the-real-risks-of-ai/',
    title: 'The real risks of AI — and who must lead on safety',
    blurb: 'Netavon on why enterprises and governments have to own AI governance and observability.',
  },
  {
    href: 'https://museeinitialize.com/blog/building-ai-responsibly/',
    title: 'Building AI responsibly',
    blurb: 'Musée Initialize, an AI company, on the discipline of building the technology with care.',
  },
  {
    href: 'https://yprateek.com/the-ai-risk-we-cant-ignore/',
    title: 'The AI risk we can’t ignore',
    blurb: 'A founder’s personal take on the conversation the industry keeps having with itself.',
  },
  {
    href: 'https://mysleepytale.com/blog/ai-and-childhood/',
    title: 'AI and childhood',
    blurb: 'MySleepyTale on kids, screens and why human-crafted stories still matter most.',
  },
  {
    href: 'https://stonedage.in/blog/unplug-in-parvati-valley/',
    title: 'Unplug in the Parvati Valley',
    blurb: 'StonedAge on putting the phone down and coming back to the analog world.',
  },
  {
    href: 'https://museeliving.com/journal/living-well-in-the-age-of-ai/',
    title: 'Living well in the age of AI',
    blurb: 'Musée Living on staying present, and choosing real human experience.',
  },
  {
    href: 'https://deramaul.com/blog/reclaiming-attention-in-the-age-of-ai/',
    title: 'Reclaiming attention in the age of AI',
    blurb: 'DeRamaul on yoga, mindfulness and getting your focus back.',
  },
];

const FAQS = [
  {
    q: 'Will AI replace human artists?',
    a: 'AI is already displacing some commercial work — a 2024 Society of Authors survey found 26% of illustrators had lost work to generative AI. But displacement is uneven, and it is pushing value toward what AI cannot authentically produce: original, culturally rooted, human-made work with a real person and a real story behind it. That provenance becomes more valuable, not less.',
  },
  {
    q: 'Is it legal for AI models to train on artists’ work?',
    a: 'It is being fought over in court right now. In Andersen v. Stability AI (US), core copyright-infringement claims from artists have been allowed to proceed; The New York Times’ case against OpenAI has advanced past dismissal; and in the UK, Getty Images won on trademark grounds while narrowing its copyright-training claims mid-trial. There are more than fifty active cases. Nothing is settled — but courts are taking artists’ claims seriously.',
  },
  {
    q: 'How can I support human artists?',
    a: 'Buy original, human-made work directly from the people who make it; credit and pay artists rather than prompting a machine; and use platforms built to give real artists visibility and a fair, direct relationship with the people who value their work. On KalaCUBE, every profile belongs to a real person and every piece is made by their own hands.',
  },
  {
    q: 'Is the art on KalaCUBE AI-generated?',
    a: 'No. KalaCUBE is a home for original, human-made art by real Indian artists and artisans across Handicraft, Visual Art and Performing Arts. Authenticity is the entire point of the platform.',
  },
];

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'AI and the Future of Human Art',
  description:
    'An honest look at AI and human artists — income, copyright and displacement — and why human-made art, and platforms that support real artists, matter.',
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  author: { '@type': 'Organization', name: 'KalaCUBE', url: SITE },
  publisher: {
    '@type': 'Organization',
    name: 'KalaCUBE',
    logo: { '@type': 'ImageObject', url: `${SITE}/brand/logo-primary.png` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL },
  articleSection: 'The KalaCUBE Journal',
  keywords:
    'AI and artists, AI art copyright, artist income, human-made art, artists in the AI age',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Journal', '/blog'],
  ['AI and the Future of Human Art', `/blog/${SLUG}`],
]);

export default function AiFutureOfHumanArt() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <article className="mx-auto max-w-3xl px-6 py-14">
        <nav className="text-sm text-neutral-500">
          <Link href="/blog" className="hover:text-[#202f9a]">Journal</Link> / AI and the Future of Human Art
        </nav>

        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">On art &amp; the AI age</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
            AI and the future of human art
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-neutral-600">
            Machines can now paint in seconds. This is an honest look at what that
            means for artists’ income, copyright and livelihoods — and why the human
            hand, and the platforms that back it, matter more than ever.
          </p>
          <p className="mt-6 text-sm text-neutral-500">
            The KalaCUBE Journal · 14 September 2026
          </p>
        </header>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-neutral-800">
          <p>
            2026 has been a strange, vertiginous year for anyone who cares about
            creativity. Scientists published the most complete wiring map of a brain
            ever made — the male fruit-fly connectome, roughly 166,000 neurons and
            about 125 million connections, a collaboration between Google Research and
            Janelia, in{' '}
            <a className="text-[#202f9a] underline" href="https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/" target="_blank" rel="noopener">
              <em>Cell</em>
            </a>
            . In the same stretch of months, AI systems began generating entire
            playable worlds from a single prompt, from an{' '}
            <a className="text-[#202f9a] underline" href="https://www.technologyreview.com/2024/10/31/1106461/this-ai-generated-minecraft-may-represent-the-future-of-real-time-video-generation/" target="_blank" rel="noopener">
              AI-rendered Minecraft
            </a>{' '}
            to Google DeepMind’s{' '}
            <a className="text-[#202f9a] underline" href="https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/" target="_blank" rel="noopener">
              Genie 3
            </a>
            . We can now read a biological mind and write synthetic ones — and the
            people building these systems are openly nervous about the pace. Even
            Demis Hassabis, who leads Google DeepMind, has called for research into
            AI’s risks to be done{' '}
            <a className="text-[#202f9a] underline" href="https://www.malaymail.com/news/money/2026/02/22/googles-ai-boss-calls-for-urgent-research-into-threats-posed-by-artificial-intelligence/210011" target="_blank" rel="noopener">
              &ldquo;urgently&rdquo;
            </a>
            .
          </p>

          <p>
            Most of the AI-risk conversation runs to the dramatic — extinction,
            loss of control, superintelligence. Those debates matter. But there is a
            quieter harm already unfolding in studios and on kitchen tables around the
            world, and it rarely makes the headlines: what happens to the people who
            make art for a living.
          </p>

          <h2 className="font-serif text-3xl">The income squeeze is already here</h2>
          <p>
            This is not a forecast. It is a measurement. In the Society of Authors’
            2024 survey of nearly 800 creative professionals,{' '}
            <a className="text-[#202f9a] underline" href="https://internationalauthors.org/news/society-of-authors-ai-survey-results-published/" target="_blank" rel="noopener">
              26% of illustrators and 36% of translators said they had already lost
              work to generative AI
            </a>
            , and 37% of illustrators reported their income falling because of it.
            More than three-quarters of illustrators expected AI to shrink their
            future earnings. For musicians, an industry study commissioned by CISAC{' '}
            <a className="text-[#202f9a] underline" href="https://www.euronews.com/2024/12/05/a-quarter-of-musician-revenue-to-be-lost-to-ai-by-2028-new-study-finds" target="_blank" rel="noopener">
              estimated that roughly a quarter of creators’ revenue could be at risk
            </a>{' '}
            to generative AI by 2028.
          </p>
          <p>
            Researchers have started to describe the mechanism plainly. A Stanford
            Graduate School of Business analysis put it in its own title:{' '}
            <a className="text-[#202f9a] underline" href="https://www.gsb.stanford.edu/insights/when-ai-generated-art-enters-market-consumers-win-artists-lose" target="_blank" rel="noopener">
              when AI-generated art enters the market, consumers win and artists lose
            </a>
            . Cheaper, faster, infinite supply pushes down the price of the exact
            commercial work — spot illustrations, stock images, background music —
            that has long paid the rent while artists made the work that mattered to
            them.
          </p>
          <p>
            None of this happens in a vacuum. The International Monetary Fund estimates
            that{' '}
            <a className="text-[#202f9a] underline" href="https://www.imf.org/en/blogs/articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity" target="_blank" rel="noopener">
              around 40% of jobs worldwide are exposed to AI
            </a>
            , and the World Economic Forum’s 2025 outlook projects{' '}
            <a className="text-[#202f9a] underline" href="https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/" target="_blank" rel="noopener">
              92 million roles displaced and 170 million created by 2030
            </a>{' '}
            — a net gain, but a wrenching reshuffle for the people caught in the churn.
            &ldquo;Exposed&rdquo; is not the same as &ldquo;erased.&rdquo; Still, for a
            working illustrator, the difference is more than semantic.
          </p>

          <blockquote className="border-l-4 border-[#202f9a] pl-5 font-serif text-2xl italic leading-snug text-[#202f9a]">
            The scarce thing in an age of infinite images is not another image. It is
            a person who made one on purpose.
          </blockquote>

          <h2 className="font-serif text-3xl">The copyright question no one has answered</h2>
          <p>
            There is a second, deeper grievance underneath the income numbers: many of
            these models were trained on artists’ own work, scraped without consent,
            credit or payment. Artists are fighting that in court, and the outcomes are
            still open. In the United States,{' '}
            <a className="text-[#202f9a] underline" href="https://www.meshiplaw.com/litigation-tracker/andersen-v-stability-ai" target="_blank" rel="noopener">
              Andersen v. Stability AI
            </a>{' '}
            has seen a judge allow the artists’ core copyright-infringement claims to
            proceed. The New York Times’{' '}
            <a className="text-[#202f9a] underline" href="https://www.axios.com/2025/04/01/nyt-openai-microsoft-lawsuit-advances" target="_blank" rel="noopener">
              case against OpenAI and Microsoft
            </a>{' '}
            has advanced past early dismissal. In the UK, Getty Images{' '}
            <a className="text-[#202f9a] underline" href="https://newsroom.gettyimages.com/en/getty-images/getty-images-issues-statement-on-ruling-in-stability-ai-uk-litigation" target="_blank" rel="noopener">
              won on trademark grounds
            </a>{' '}
            — though it narrowed its copyright-training claims mid-trial, so it is not
            the sweeping victory some headlines suggested.
          </p>
          <p>
            Taken together — and there are now{' '}
            <a className="text-[#202f9a] underline" href="https://www.bakerlaw.com/services/artificial-intelligence-ai/case-tracker-artificial-intelligence-copyrights-and-class-actions/" target="_blank" rel="noopener">
              more than fifty such suits being tracked
            </a>{' '}
            — the law is unsettled but the direction of travel is clear: courts are
            treating &ldquo;we trained on it&rdquo; as a claim that has to be answered,
            not waved away. For artists, that is the difference between being raw
            material and being rights-holders.
          </p>

          <h2 className="font-serif text-3xl">Why the human hand matters more, not less</h2>
          <p>
            It would be easy to end on despair. We won’t, because the honest picture is
            more interesting than that. When any machine can produce a competent image
            on demand, competence stops being the scarce thing. What becomes scarce —
            and, we’d argue, more valuable — is authorship: a real person, a real hand,
            a real place and tradition, a real reason this piece exists. A Madhubani
            painting carries generations of Mithila. A hand-thrown pot carries the
            potter’s afternoon. Provenance, the plain fact that a human being made
            this on purpose, is exactly what an averaged model cannot honestly claim.
          </p>
          <p>
            This is not nostalgia. It is a market signal. The same years that gave us
            infinite synthetic media have also produced a hunger for the demonstrably
            human — vinyl records outselling CDs, film cameras back on shelves, people
            paying a premium for the handmade. When the digital becomes frictionless
            and forgeable, the analog and the authentic become the luxury.
          </p>

          <h2 className="font-serif text-3xl">What platforms owe artists now</h2>
          <p>
            If provenance is the value, then the job of a platform is to protect and
            surface it. That means putting a real person at the centre of every page,
            keeping the relationship between maker and buyer direct rather than
            skimming it, and refusing to blur the line between human-made and
            machine-made. It means treating an artist’s work as theirs.
          </p>
          <p>
            That is the whole reason{' '}
            <Link href="/" className="text-[#202f9a] underline">KalaCUBE</Link>{' '}
            exists. It grew out of Musée Art Café in Dehradun, where local art lived on
            physical walls; when the world moved online, we took those walls with us.
            Every profile in our{' '}
            <Link href="/all-artist" className="text-[#202f9a] underline">directory of artists</Link>{' '}
            belongs to a real person, every piece in the{' '}
            <Link href="/explore" className="text-[#202f9a] underline">gallery</Link>{' '}
            is made by human hands, and artists keep their own relationship with the
            people who buy their work. AI will keep getting better at making images.
            Our bet is on the people who make art — and on the growing number of
            people who specifically want the human kind.
          </p>
        </div>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl">Frequently asked</h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-neutral-200 bg-white p-5 open:border-[#202f9a]/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg">
                  {f.q}
                  <span className="ml-4 text-[#202f9a] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Network interlinks */}
        <section className="mt-14 rounded-2xl border border-[#202f9a]/30 bg-[#eef1ff] p-6">
          <h2 className="font-serif text-2xl">More from across our network</h2>
          <p className="mt-2 text-sm text-neutral-600">
            KalaCUBE is part of a small family of ventures thinking through the same
            2026 moment from different angles.
          </p>
          <ul className="mt-5 space-y-4">
            {NETWORK.map((n) => (
              <li key={n.href}>
                <a href={n.href} target="_blank" rel="noopener" className="font-medium text-[#202f9a] underline">
                  {n.title}
                </a>
                <span className="block text-sm text-neutral-600">{n.blurb}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing */}
        <div className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          <p>
            Read more in the{' '}
            <Link href="/blog" className="text-[#202f9a] underline">KalaCUBE Journal</Link>, or see
            our{' '}
            <Link href="/faqs" className="text-[#202f9a] underline">FAQs for artists and buyers</Link>.
            KalaCUBE is a home for India’s artists — human hands, original work.
          </p>
        </div>

        {/* Sources */}
        <div className="mt-10 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-500">
          <p className="font-medium text-neutral-600">Sources</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Society of Authors, AI Survey 2024 — internationalauthors.org</li>
            <li>CISAC / PMP study on AI and music revenue, 2024 — euronews.com</li>
            <li>Stanford GSB, “When AI-Generated Art Enters the Market…” — gsb.stanford.edu</li>
            <li>IMF, “AI Will Transform the Global Economy,” Jan 2024 — imf.org</li>
            <li>WEF, Future of Jobs Report 2025 — weforum.org</li>
            <li>Andersen v. Stability AI litigation tracker — meshiplaw.com</li>
            <li>NYT v. OpenAI/Microsoft, case advances — axios.com</li>
            <li>Getty Images v. Stability AI (UK) ruling statement — gettyimages.com</li>
            <li>BakerHostetler AI case tracker — bakerlaw.com</li>
            <li>Male fruit-fly connectome (Cell, 2026) — research.google</li>
            <li>Genie 3 world model — deepmind.google; AI-generated Minecraft — technologyreview.com</li>
            <li>Hassabis on urgent AI-risk research (Feb 2026) — malaymail.com</li>
          </ol>
        </div>
      </article>
    </main>
  );
}
