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
      <h3>Which finger plays which key?</h3>
      <p>Turn on the <strong>Finger Numbers</strong> toggle in any practice session to see a small numbered circle on the key you should press next (and on each falling note in Rhythm Mode). Standard piano fingering numbers each finger 1 through 5:</p>
      <div class="finger-legend">
        <span class="finger-legend-item"><span class="finger-badge-static">1</span> Thumb</span>
        <span class="finger-legend-item"><span class="finger-badge-static">2</span> Index</span>
        <span class="finger-legend-item"><span class="finger-badge-static">3</span> Middle</span>
        <span class="finger-legend-item"><span class="finger-badge-static">4</span> Ring</span>
        <span class="finger-legend-item"><span class="finger-badge-static">5</span> Pinky</span>
      </div>
      <p>This app currently teaches single-line melodies played with the <strong>right hand</strong>, so every finger number shown is for the right hand. Fingering is auto-generated using a simple five-finger-position rule — it's a helpful guide rather than an authoritative professional fingering, so feel free to adjust if a teacher suggests something different.</p>
    </section>

    <section class="card">
      <h3>Wait for Me vs. Rhythm Mode</h3>
      <p><strong>Wait for Me</strong> pauses and waits for you to play the correct key — perfect while you're still learning where notes are. <strong>Rhythm Mode</strong> plays notes falling toward the keyboard in real time, like a real piece of music — it scores your timing so you can build real playing skill.</p>
    </section>

    <section class="card">
      <h3>About the songs</h3>
      <p>Kids' songs and folk pieces like Greensleeves or House of the Rising Sun are traditional, public-domain melodies. Classical pieces are labeled "simplified arrangement" because they're beginner-friendly excerpts, arranged specifically for this app rather than exact transcriptions of any copyrighted score.</p>
      <p>The "Originals for Teens &amp; Adults" pieces are original compositions written for this app: Fading Echoes and Hollow Lullaby draw on the moody, minor-key piano-ballad mood of bands like Evanescence; Shattered Glass and Waking the Storm draw on the driving alt-rock/nu-metal piano riffs of bands like Linkin Park; Wounded Serenade and Static Valentine draw on the romantic gothic-rock ballad mood of bands like HIM. Neon Rain and the 12-Bar Blues Groove are general-purpose bonus pieces. None of these are covers of, or affiliated with or endorsed by, any specific song, artist, or band. That's a deliberate choice — actual song melodies from that era are still under copyright (transposing to a different key doesn't change that), so this app writes its own music instead of reproducing anyone else's.</p>
    </section>
  `;
}
