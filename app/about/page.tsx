import Rule from "@/components/Rule";

export const metadata = { title: "about" };

export default function About() {
  return (
    <article className="prose pt-6">
      <h1 className="mono text-2xl font-semibold tracking-tight">about</h1>
      <p>
        I&apos;m a machine learning student who likes to understand things from
        first principles and then write them down before I forget. This site is
        where that happens.
      </p>
      <Rule />
      <p>
        Most posts here are technical: a derivation I finally understood, a paper
        I&apos;m chewing on, or a small experiment. I care about getting the math
        right and the explanation clear — and about making the whole thing nice
        to read.
      </p>
      <h2>elsewhere</h2>
      <ul className="mono text-sm">
        <li>
          github ·{" "}
          <a href="https://github.com/Rushi0070" target="_blank" rel="noreferrer">
            @Rushi0070
          </a>
        </li>
      </ul>
    </article>
  );
}
