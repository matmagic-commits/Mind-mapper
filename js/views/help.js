export function mount(container, params, ctx) {
  container.innerHTML = `
    <section class="page-header">
      <h1>Help &amp; About</h1>
    </section>

    <section class="card">
      <h3>Why is this free?</h3>
      <p>Piano Steps is a small, static web app with no server, no accounts, and no subscription. Everything — your progress, your settings — is saved locally in your browser. There's nothing to pay for because there's no ongoing cost to run it.</p>
    </section>

    <section class="card">
      <h3>How do I play notes?</h3>
      <ul class="help-list">
        <li><strong>Mouse or touch:</strong> click or tap the on-screen keys directly.</li>
        <li><strong>Computer keyboard:</strong> use the rows below — great when you don't have a real keyboard handy.</li>
        <li><strong>MIDI keyboard:</strong> plug in a USB MIDI keyboard or piano and it's detected automatically (requires a browser that supports Web MIDI, such as Chrome or Edge).</li>
      </ul>
      <div class="keymap-diagram">
        <div class="keymap-row"><span class="keymap-label">Upper octave</span><code>Q W E R T Y U I O P</code></div>
        <div class="keymap-row"><span class="keymap-label">Upper sharps/flats</span><code>2 3 &nbsp; 5 6 7 &nbsp; 9 0</code></div>
        <div class="keymap-row"><span class="keymap-label">Lower octave</span><code>Z X C V B N M , . /</code></div>
        <div class="keymap-row"><span class="keymap-label">Lower sharps/flats</span><code>S D &nbsp; G H J &nbsp; L ;</code></div>
      </div>
    </section>

    <section class="card">
      <h3>Wait for Me vs. Rhythm Mode</h3>
      <p><strong>Wait for Me</strong> pauses and waits for you to play the correct key — perfect while you're still learning where notes are. <strong>Rhythm Mode</strong> plays notes falling toward the keyboard in real time, like a real piece of music — it scores your timing so you can build real playing skill.</p>
    </section>

    <section class="card">
      <h3>About the songs</h3>
      <p>Kids' songs and folk pieces like Greensleeves or House of the Rising Sun are traditional, public-domain melodies. Classical pieces are labeled "simplified arrangement" because they're beginner-friendly excerpts, arranged specifically for this app rather than exact transcriptions of any copyrighted score.</p>
      <p>The "Originals for Teens &amp; Adults" pieces (Fading Echoes, Shattered Glass, Neon Rain, Waking the Storm, 12-Bar Blues Groove) are original compositions written for this app. They're inspired by the mood and riff style of 2000s rock and emo piano ballads, but they are not covers of, and are not affiliated with or endorsed by, any specific song, artist, or band. That's a deliberate choice — actual song melodies from that era are still under copyright, so this app writes its own music instead of reproducing anyone else's.</p>
    </section>
  `;
}
