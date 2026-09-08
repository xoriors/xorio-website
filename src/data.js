/*
 * All site content lives here. build.js turns it into static HTML.
 *
 * Project fields:
 *   id        URL slug: /p/<id>
 *   name      display name
 *   kind      'app' (hosted web app) | 'oss' (repository)
 *   cats      filter keys, see FILTERS
 *   shot      screenshot id — a file in src/shots/<shot>.png, converted by
 *             `npm run images`. Omit for repositories without a screenshot;
 *             they get a CSS-rendered card instead.
 *   fit       'top' | 'center' — which part of the screenshot to show on cards
 *   art       optional decorative art on CSS-rendered cards (see styles.css)
 *   diagram   optional architecture image id (src/shots/<diagram>.png)
 *   live      URL of the running app
 *   repo      repository URL (GitHub or GitLab)
 *   issues    issues URL to link "Browse issues"
 *   video     YouTube URL
 *   cotw      "crate of the week" announcement URL
 *   tags      short labels on the card
 *   tech      stack chips on the detail page
 *   blurb     one-liner
 *   body      paragraphs for the detail page
 *   helpIssues  [{t,url}] "good first issues" list
 *
 * Star counts are NOT stored here: they come from the hand-maintained
 * project/data/stats.json (founder numbers on the About page are fetched
 * live in the browser, see src/app.js).
 */
'use strict';

const SITE = {
  name: 'xorio',
  url: 'https://xorio.rs',
  title: 'xorio — open source, built in the open',
  description: 'xorio — a Rust & STEM open-source collective. Live apps, an open-source core, and open experiments. Pick a project, claim an issue, and ship with us.',
  tagline: 'software craftsmanship, in the open',
  email: 'hello@xorio.rs',
  discord: 'https://discord.gg/3W3mwWvz8y',
  github: 'https://github.com/xoriors',
  founderGithub: 'https://github.com/radumarias',
  linkedin: 'https://www.linkedin.com/company/xorio',
  contributing: 'https://github.com/xoriors/rencfs/blob/main/.github/CONTRIBUTING.md'
};

const DISCORD = SITE.discord;

const PROJECTS = [
  {id:'unlost',name:'Unlost in Translation',kind:'app',cats:['ai'],shot:'unlost',fit:'top',
   live:'https://unlost-in-translation.vercel.app/',tags:['ai','gemini'],tech:['Gemini','React','PWA'],
   blurb:'Context-aware bilingual conversation translator.',
   body:['Goes beyond word-for-word translation — pick a tone (casual, formal, polite, romantic) and a situation (ordering food, airport, small talk) and the AI shapes the result to fit the social context, so you avoid awkward cultural missteps.',
         'Split-screen conversation mode tracks the back-and-forth, an image mode translates menus and signs, a full-screen flashcard view lets you just show your phone, and shareable URLs pre-fill everything for the other person.']},
  {id:'weather-voodoo',name:'Weather Voodoo',kind:'app',cats:['maps'],shot:'weather-voodoo',fit:'top',
   live:'https://weather-voodoo.vercel.app',repo:'https://github.com/xoriors/experimental/tree/main/weather-voodoo',tags:['weather','pwa'],tech:['PWA','OSM routing','Open-Meteo'],
   blurb:'Hyperlocal trip planner that scores the next 3 days 0–100.',
   body:['Ask "what\'s the weather along the path from Phi Phi to Krabi at 14:00 tomorrow?" — it samples points along a real OSM route (ferry, hiking or cycling), fetches a forecast at each, and fuses wind, gust, rain, waves and visibility into a single 0–100 score.',
         'Trip-window scoring ranks every start time by its worst hour, a live wind compass shows head- vs tail-wind for your heading, and GPS follow mode tracks you with a rotating arrow. Installs as a PWA and works offline.']},
  {id:'echoread',name:'EchoRead',kind:'app',cats:['ai'],shot:'echoread',fit:'top',
   live:'https://echoread-527868439551.us-west1.run.app',repo:'https://github.com/xoriors/echo-read',tags:['ai','audio'],tech:['Gemini','Playwright','TTS'],
   blurb:'Turns articles, PDFs & videos into a premium audio reader.',
   body:['Ingests almost anything — web articles (via a headless Playwright backend that strips ads and menus), PDFs, YouTube videos, or pasted text — and reads it back with real-time highlighting.',
         'Gemini powers full-text, short, or long structured summaries (key topics + takeaways). A sleep timer, speed and seek controls, a Read-Later queue and history make it a hands-free reading suite.']},
  {id:'gatherspace',name:'GatherSpace',kind:'app',cats:['realtime'],shot:'gatherspace',fit:'center',
   live:'https://gatherspace-46500086196.europe-west2.run.app',tags:['realtime','webrtc'],tech:['WebRTC','Firebase'],
   blurb:'Spatial virtual office with proximity audio & video.',
   body:['Log in as an avatar on a shared 2D canvas; audio and video connections form dynamically based on how close you are to others — just walk your avatar over to a group to talk, mimicking real office interactions.',
         'WebRTC + Firebase power text chat, screen-sharing, draggable video tiles, custom presence statuses ("deep work", "brb") and a knock/ping to get a coworker\'s attention.']},
  {id:'echolearn',name:'EchoLearn',kind:'app',cats:['ai'],shot:'echolearn',fit:'top',
   live:'https://echolearn-527868439551.us-west1.run.app',tags:['ai','learning'],tech:['Gemini'],
   blurb:'AI microlearning that challenges your biases.',
   body:['Breaks complex topics into bite-sized, digestible lessons — but instead of a single narrative, it deliberately presents diverse, contrasting viewpoints so you see multiple sides of a subject.',
         'Gemini generates the nuanced, multi-perspective content. It\'s built to teach you how to think about a topic, not just what to think.']},
  {id:'geolens',name:'GeoLens AI',kind:'app',cats:['ai','maps'],shot:'geolens',fit:'top',
   live:'https://geolens-ai-photo-tourism-527868439551.europe-west2.run.app',tags:['ai','travel'],tech:['Vision AI','Search grounding','TTS'],
   blurb:'Point your camera at a landmark, get its story.',
   body:['Vision AI identifies monuments and famous sites from a single photo, then overlays rich historical context fetched live via Google Search grounding — not a stale static database.',
         'On-demand audio narration turns it into a hands-free tour guide, all wrapped in an AR-style dark interface with scanning animations and glass overlays.']},
  {id:'muse-studio',name:'Muse Studio',kind:'app',cats:['media','ai'],shot:'muse-studio',fit:'top',
   live:'https://muse-studio-527868439551.us-west1.run.app',tags:['veo','media'],tech:['Veo 3.1','Gemini'],
   blurb:'Cinematic AI video + image suite (Christmas Edition).',
   body:['An all-in-one creative sandbox built on Veo 3.1 and Gemini: dedicated Shorts/Reels makers for vertical 9:16 content, multi-image "viral reels" that fuse reference photos, and text-to-image up to 4K.',
         'Image-to-video animation, "magic" instruction-based editing, and a deep-reasoning Muse assistant for brainstorming — all wrapped in a festive, snow-dusted holiday UI.']},
  {id:'muse-elite',name:'Muse Studio: Elite',kind:'app',cats:['media','ai'],shot:'muse-elite',fit:'top',
   live:'https://muse-studio-elite-creator-edition-527868439551.us-west1.run.app',tags:['veo','media'],tech:['Veo','Gemini'],
   blurb:'Pro cinematic content suite for creators.',
   body:['The Elite Creator Edition leans into high-fidelity short-form video: a Viral Creator and Cinema Stitcher combine static frames with cinematic transitions (Dynamic Zoom, Glitch Pulse, VHS) paired with musical "vibes".',
         'Veo-powered image-to-video, thematic gift and holiday generators, and a rapid "Holiday Lab" for polishing pixels and relighting images like a pro.']},
  {id:'quote-video',name:'AI Quote Video Generator',kind:'app',cats:['media','ai'],shot:'quote-video',fit:'top',
   live:'https://ai-quote-video-generator-527868439551.us-west1.run.app',tags:['veo','tts'],tech:['Veo','Gemini','TTS'],
   blurb:'End-to-end AI quote-video generator.',
   body:['Describe or upload a character; the pipeline generates the image (gemini-2.5-flash-image), writes an original motivational quote, voices it with TTS, and stitches it all into a lifelike Veo video — no editing skills needed.',
         'A second "Thinking Mode" tab exposes gemini-2.5-pro with a high thinking budget for deep, multi-step reasoning on tough problems.']},
  {id:'chromamotion',name:'ChromaMotion',kind:'app',cats:['media','ai'],shot:'chromamotion',fit:'top',
   live:'https://chromamotion-527868439551.us-west1.run.app',tags:['gemini','veo'],tech:['Gemini','Veo'],
   blurb:'Colorize and animate old photos.',
   body:['Uses Google\'s generative AI to add realistic, high-quality color to black-and-white or faded photos, then brings them to life as short cinematic videos via Veo.',
         'If video generation is blocked by safety filters, a client-side Ken Burns fallback pans and zooms locally in the browser. Batch upload, rotate and fullscreen preview included.']},
  {id:'gr-sim',name:'General Relativity Simulator',kind:'app',cats:['sim'],shot:'gr-sim',fit:'center',
   live:'https://general-relativity-simulator-1.ai.studio',video:'https://www.youtube.com/playlist?list=PLFLRW7CHRb40',tags:['physics','3d'],tech:['AI Studio','WebGL'],
   blurb:'Interactive general-relativity simulator — warp spacetime in the browser.',
   body:['An interactive simulator for exploring general relativity: place masses, watch spacetime curve, and see how gravity emerges from geometry rather than force.',
         'Built with Google AI Studio. A companion YouTube playlist walks through the simulations and the physics behind them.']},
  {id:'solar-eclipse',name:'Solar Eclipse 2026',kind:'app',cats:['sim'],shot:'solar-eclipse',fit:'center',
   live:'https://solar-eclipse-2026.vercel.app',repo:'https://github.com/xoriors/experimental/tree/main/solar-eclipse-2026',tags:['astronomy','sim'],tech:['NASA data','Web'],
   blurb:'Replay the August 12, 2026 total eclipse from any point on Earth.',
   body:['A minute-by-minute simulator of the total solar eclipse crossing Greenland, Iceland and Spain on August 12, 2026 — enter any location and get computed contact times, eclipse depth and the Sun\'s position in the sky, all derived live from NASA\'s published eclipse parameters.',
         'A "where to watch" section weighs totality duration against historical cloud cover for candidate cities, safety guidance covers ISO 12312-2 glasses (the Sun sits very low from Spain), and the app is honest about uncertainty near the path edges caused by the Moon\'s irregular limb.']},
  {id:'ice-cube',name:'Ice Cube Simulator',kind:'app',cats:['sim'],shot:'ice-cube',fit:'center',
   live:'https://claude.ai/code/artifact/077afa92-721b-41b3-8cf1-a69bdaadba8c',repo:'https://github.com/xoriors/experimental/tree/main/ice-cube-simulator',tags:['physics','canvas'],tech:['Canvas','JS'],
   blurb:'Why ice floats — a hands-on density lab with a draggable cube.',
   body:['An interactive tank where you can grab the ice cube, push it under and feel Archimedes push back — it settles at exactly 91.7% submerged, matching the 0.917 ice-to-water density ratio.',
         'Start melting and watch the honeycomb lattice collapse in the live molecular view, the cube hold at 0 °C while hydrogen bonds break, and the waterline stay put as the meltwater fills exactly the volume the cube displaced.']},
  {id:'ice-density',name:'Ice Density Simulator',kind:'app',cats:['sim'],shot:'ice-density',fit:'center',
   live:'https://ice-density-simulator.xorio42.chatgpt.site',tags:['physics','molecules'],tech:['Web','Canvas'],
   blurb:'Molecular density lab: why the same H₂O takes more room frozen.',
   body:['Visualizes the 917:1000 kg/m³ density ratio between ice and liquid water: the same molecules, but frozen into an open hydrogen-bonded lattice that occupies ~9% more space.',
         'A float-and-melt animation shows the cube riding 8.3% above the waterline and demonstrates why the level doesn\'t move when it melts — floating ice already displaces exactly its own weight in water.']},
  {id:'rencfs',name:'rencfs',kind:'oss',cats:['fs'],art:'rencfs',diagram:'rencfs-layers',cotw:'https://this-week-in-rust.org/blog/2024/08/14/this-week-in-rust-560/#crate-of-the-week',
   repo:'https://github.com/xoriors/rencfs',issues:'https://github.com/xoriors/rencfs/issues',tags:['rust','crypto'],tech:['Rust','FUSE','AEAD','ring'],
   blurb:'Encrypted FUSE filesystem in Rust — Rust crate of the week.',
   body:['An encrypted filesystem written in Rust and mounted with FUSE on Linux, letting you create encrypted directories you can safely back up to untrusted cloud storage and sync across devices.',
         'Uses well-known audited AEAD primitives (AES-256-GCM / ChaCha20-Poly1305), guards credentials in memory with mlock, mprotect and zeroize, supports fast parallel seek-able reads & writes, and lets you change password without re-encrypting everything. Usable as a CLI or a library.',
         'It was Rust "crate of the week" in August 2024 — and there\'s a friendly backlog of good first issues.'],
   helpIssues:[
     {t:'Use error correction for data recovery',url:'https://github.com/xoriors/rencfs/issues/277'},
     {t:'Use passkey as 2FA to unlock the filesystem',url:'https://github.com/xoriors/rencfs/issues/228'},
     {t:'Bindings for Python',url:'https://github.com/xoriors/rencfs/issues/203'},
     {t:'Add compression',url:'https://github.com/xoriors/rencfs/issues/236'},
     {t:'IPFS plugin',url:'https://github.com/xoriors/rencfs/issues/255'},
     {t:'Move examples to separate crates',url:'https://github.com/xoriors/rencfs/issues/276'}]},
  {id:'syncoxide',name:'SyncOxiders',kind:'oss',cats:['fs'],live:'https://syncoxide.rs',
   repo:'https://github.com/radumarias/syncoxiders',issues:'https://github.com/radumarias/syncoxiders/issues',tags:['rust','e2ee'],tech:['Rust','E2EE'],
   blurb:'Cloud file & email sync, sharing, encryption & backup — in Rust.',
   body:['SyncOxiders syncs files and email across cloud providers and adds inter-cloud encryption, sharing and backup — an end-to-end encrypted layer over the storage you already use.',
         'Written in Rust with a focus on safety and performance. One open feature looking for an owner: peer-to-peer file transfer in the browser.']},
  {id:'rfs',name:'rfs',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/rfs',issues:'https://github.com/radumarias/rfs/issues',tags:['rust','distributed'],tech:['Rust'],
   blurb:'Distributed filesystem written in Rust.',
   body:['A distributed filesystem written in Rust — part of the same storage family as rencfs and SyncOxiders.',
         'Ambitious and early; a great playground if you like distributed systems and storage internals.']},
  {id:'rencrypt',name:'rencrypt-python',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/rencrypt-python',tags:['python','rust'],tech:['Rust','Python','ring'],
   blurb:'Fast Python encryption library, implemented in Rust.',
   body:['A Python encryption library implemented in Rust, supporting AEAD with AES-GCM and ChaCha20-Poly1305 via the audited ring crate.',
         'Brings rencfs-grade cryptography to Python at native speed.']},
  {id:'zeroize',name:'zeroize-python',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/zeroize-python',tags:['python','rust'],tech:['Rust','Python'],
   blurb:'Securely wipe secrets from memory, from Python.',
   body:['Securely clears secrets from memory, built on stable Rust primitives that guarantee the zeroing won\'t be optimized away by the compiler.',
         'A small but essential building block for handling sensitive data safely.']},
  {id:'rencfs-desktop',name:'rencfs-desktop',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/rencfs-desktop',tags:['rust','gui'],tech:['Rust','egui'],
   blurb:'Desktop GUI for the rencfs encrypted filesystem.',
   body:['A graphical desktop front-end for rencfs, so you can mount and manage encrypted directories without touching the CLI.',
         'Part of bringing rencfs to macOS and Windows alongside the daemon and mobile apps.']},
  {id:'rvdebugger',name:'rvdebugger',kind:'oss',cats:['devtools'],
   repo:'https://github.com/radumarias/rvdebugger',tags:['rerun','3d'],tech:['Python','Rerun','rerun-sdk'],
   blurb:'Watch concurrent programs run in 3D, via Rerun.',
   body:['A small experimental toolkit for visualizing concurrent program execution in 3D using Rerun (rerun-sdk). Instead of reading thread logs or stack traces, you watch threads run as nodes, lines and lock-pins laid out in space and time.',
         'Great for seeing deadlocks and race conditions for what they really are. Sample videos and specs are linked in the repo.']},
  {id:'charts-builder',name:'Charts Builder',kind:'oss',cats:['devtools','ai'],
   repo:'https://github.com/xoriors/charts-builder',issues:'https://github.com/xoriors/charts-builder/issues/1',tags:['ai-agents'],tech:['AI agents','TypeScript'],
   blurb:'Generate chart code & datasets with AI coding agents.',
   body:['A toolkit that uses AI coding agents to automatically generate chart code and sample datasets from a prompt.',
         'Early-stage and open for contributors — a great place to experiment with agent-driven code generation.']},
  {id:'claude-plugin',name:'xorio-claude-plugin',kind:'oss',cats:['devtools','ai'],
   repo:'https://github.com/radumarias/xorio-claude-plugin',tags:['claude','mcp'],tech:['Claude Code','MCP'],
   blurb:'Claude Code plugin for everyday dev tasks.',
   body:['A Claude Code plugin that packages xorio\'s common dev workflows and prompts into reusable commands.',
         'Built for the team\'s day-to-day work; contributions and new commands welcome.']},
  {id:'statusline',name:'claude-code-statusline',kind:'oss',cats:['devtools'],
   repo:'https://github.com/radumarias/claude-code-statusline',tags:['claude','shell'],tech:['Claude Code','Shell'],
   blurb:'A rich, configurable status line for Claude Code.',
   body:['Adds an informative, configurable status line to Claude Code sessions so you always know your context at a glance.']},
  {id:'claude-agent',name:'claude-agent',kind:'oss',cats:['devtools','ai'],shot:'claude-agent',fit:'center',
   repo:'https://github.com/xoriors/claude-agent',tags:['claude','java'],tech:['Java','Spring Boot','MCP','MongoDB'],
   blurb:'Consume REST APIs from OpenAPI specs and generate Spring Boot apps — no manual coding.',
   body:['An experimental agent setup where Claude Code discovers a REST API from its OpenAPI spec via MCP, executes calls, and persists results to MongoDB — with zero prior knowledge of the API.',
         'From there it auto-generates a complete Spring Boot application. Ships with Docker setup and worked examples against the PetStore and Weather APIs, from simple queries to multi-endpoint workflows.']},
  {id:'grpc-capnproto',name:'grpc-capnproto',kind:'oss',cats:['systems'],art:'capnproto',
   repo:'https://gitlab.com/radumarias/grpc-capnproto',tags:['rust','quic'],tech:['Rust','Cap\'n Proto','QUIC','RDMA'],
   blurb:'gRPC with Cap\'n Proto over HTTP/3 (QUIC) + RDMA.',
   body:['An experiment in high-performance RPC: gRPC semantics with Cap\'n Proto serialization over HTTP/3 (QUIC) and RDMA, written in Rust.',
         'Hosted on GitLab. For systems folks who like their networking fast.']},
  {id:'ciphershell',name:'ciphershell-kotlin',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/ciphershell-kotlin',tags:['kotlin','rust'],tech:['Kotlin Multiplatform','Compose','JNI'],
   blurb:'Cross-platform GUI for rencfs, in Kotlin.',
   body:['A graphical front-end for rencfs built with Kotlin Multiplatform + Compose, talking to the Rust core through a java-bridge.',
         'Brings the encrypted filesystem to desktop and mobile with a single shared UI codebase.']},
  {id:'rencfs-daemon',name:'rencfs-daemon',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/rencfs-daemon',tags:['rust','grpc'],tech:['Rust','systemd','tonic','gRPC'],
   blurb:'Encrypted filesystem daemon, exposed over gRPC.',
   body:['Runs rencfs as a background daemon, installable as a systemd service and controlled through a gRPC server.',
         'Designed for performance and security in always-on encrypted file management.']},
  {id:'gdrive-rs',name:'gdrive-rs',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/gdrive-rs',tags:['rust','fuse'],tech:['Rust','fuse3'],
   blurb:'Mount Google Drive as a filesystem, in Rust.',
   body:['A Google Drive client in Rust that uses fuse3 to expose your Drive as a normal mounted filesystem.',
         'Access and manage cloud files directly from the command line and your file manager.']},
  {id:'in-mem-fs',name:'in-mem-fs',kind:'oss',cats:['fs'],
   repo:'https://github.com/radumarias/in-mem-fs',tags:['rust','fuse'],tech:['Rust','FUSE'],
   blurb:'In-memory filesystem in Rust, via FUSE.',
   body:['A compact in-memory filesystem exposed with FUSE on Linux — files live entirely in RAM for fast, ephemeral operations with no persistent-storage overhead.',
         'A clear reference for how FUSE filesystems are structured in Rust.']},
  {id:'fuse3-template',name:'rust-fuse3-template',kind:'oss',cats:['fs','devtools'],
   repo:'https://github.com/radumarias/rust-fuse3-template',tags:['rust','template'],tech:['Rust','fuse3'],
   blurb:'Starter template for FUSE filesystems in Rust.',
   body:['A ready-to-fork template for building a custom filesystem in Rust with fuse3, including a minimal working implementation.',
         'A fast on-ramp for anyone starting a new filesystem project.']},
  {id:'dbos',name:'dbos',kind:'oss',cats:['systems'],
   repo:'https://github.com/radumarias/dbos',tags:['rust','os'],tech:['Rust','kernel'],
   blurb:'A database-optimized operating system, in Rust.',
   body:['An experimental OS optimized for database systems — it runs workloads in kernel space with minimal resource use, chasing maximum throughput for data-heavy applications.',
         'Deep-systems territory for anyone curious about OS and database internals.']},
  {id:'rvirt-gpu',name:'Rvirt GPU',kind:'oss',cats:['systems'],
   repo:'https://github.com/radumarias/rvirt-gpu',tags:['rust','gpu'],tech:['Rust','virtualization'],
   blurb:'GPU virtualization for efficient resource sharing.',
   body:['A project exploring GPU virtualization — sharing and managing GPU resources efficiently across workloads to boost utilization and performance.',
         'Early and ambitious; great for systems and graphics enthusiasts.']},
  {id:'genie-do',name:'Genie Do',kind:'oss',cats:['devtools'],
   repo:'https://github.com/radumarias/genie-do',tags:['automation'],tech:['Rust'],
   blurb:'Task automation to streamline everyday work.',
   body:['A task-automation tool that simplifies repetitive everyday jobs through streamlined, scriptable workflows.',
         'Aimed at squeezing more productivity out of routine work.']},
  {id:'crypto-bench',name:'python-crypto-benchmark',kind:'oss',cats:['devtools','fs'],
   repo:'https://github.com/radumarias/python-crypto-benchmark',tags:['python','crypto'],tech:['Python'],
   blurb:'Benchmark Python crypto libraries head-to-head.',
   body:['Compares the performance and efficiency of multiple Python cryptography libraries with reproducible benchmarks.',
         'Helps developers pick the right crypto library based on real data, not guesswork.']},
  {id:'aws-template',name:'aws-lambda-axum-dynamodb',kind:'oss',cats:['devtools'],
   repo:'https://github.com/radumarias/aws-lambda-axum-dynamodb-template',tags:['rust','aws'],tech:['Rust','AWS Lambda','axum','DynamoDB'],
   blurb:'Serverless Rust starter on AWS Lambda + axum.',
   body:['A template app wiring up AWS Lambda, axum, DynamoDB, API Gateway and CloudWatch.',
         'A solid foundation for building serverless applications in Rust on AWS.']},
  {id:'action-version',name:'action-check-version-changed-rust',kind:'oss',cats:['devtools'],
   repo:'https://github.com/radumarias/action-check-version-changed-rust',tags:['ci','rust'],tech:['GitHub Actions','Rust'],
   blurb:'CI action: detect Cargo.toml version bumps.',
   body:['A GitHub Action that checks whether the version in Cargo.toml has changed since the last run.',
         'Handy for automating releases and keeping version numbers consistent.']},
  {id:'experimental',name:'experimental',kind:'oss',cats:['devtools'],
   repo:'https://github.com/xoriors/experimental',issues:'https://github.com/xoriors/experimental/issues',tags:['monorepo'],tech:['Monorepo'],
   blurb:'The xorio experiment sandbox & incubator.',
   body:['The umbrella repository where xorio\'s experiments and showcase apps incubate — including Weather Voodoo and many of the AI tools.',
         'A good place to browse open issues and pick something to build with us.']}
];

const GROUPS = [
  {title:'AI apps',ids:['unlost','echoread','echolearn']},
  {title:'Creative & media',ids:['chromamotion']},
  {title:'Maps & realtime',ids:['weather-voodoo','gatherspace']},
  {title:'Filesystems, sync & crypto',ids:['rencfs','syncoxide','rfs','rencfs-desktop','rencfs-daemon','ciphershell','gdrive-rs','in-mem-fs','fuse3-template','rencrypt','zeroize','crypto-bench']},
  {title:'Systems & low-level',ids:['dbos','rvirt-gpu','grpc-capnproto']},
  {title:'Dev-tools, agents & automation',ids:['rvdebugger','charts-builder','genie-do','aws-template','action-version','experimental']},
  {title:'AI coding agents',ids:['claude-plugin','statusline','claude-agent']},
  {title:'Simulation',ids:['gr-sim','solar-eclipse','ice-cube','ice-density']},
  {title:'Other',ids:['geolens','muse-studio','muse-elite','quote-video']}
];

const FILTERS = [
  {key:'all',label:'All'},{key:'app',label:'Apps'},{key:'oss',label:'Open Source'},
  {key:'ai',label:'AI'},{key:'media',label:'Media'},{key:'fs',label:'Filesystems'},
  {key:'devtools',label:'Dev-tools'},{key:'sim',label:'Simulation'},{key:'realtime',label:'Realtime'},{key:'maps',label:'Maps'},{key:'systems',label:'Systems'}
];

const EXPERIMENTS = [
  {title:'AI agents delegate actions',desc:'MCP proxy or sub-agents to offload agent memory, shrink the main context and cut tokens.',tag:'agents',url:'https://github.com/xoriors/experimental/tree/main/AI-agents-delegate-actions'},
  {title:'Git merge-conflict prompt',desc:'A structured prompt that lets AI agents resolve merge conflicts intelligently.',tag:'agents',url:'https://github.com/xoriors/experimental/tree/main/llm-git-conflict-resolve'},
  {title:'MCP as a REST replacement',desc:'Showcase how MCP tools outperform REST endpoints for agent interactions.',tag:'agents'},
  {title:'Rerun.io MCP server',desc:"Expose Rerun's 3D visualization APIs as an MCP toolset for agents.",tag:'agents'},
  {title:'Semantic zero-knowledge-like proof',desc:'Reset passwords with LLMs via a semantic ZK-like proof.',tag:'security',url:'https://github.com/xoriors/experimental/issues/4'},
  {title:'Vibe-coding context injection',desc:'Inject style or mood context into coding agents to influence output tone.',tag:'agents'},
  {title:'Compact an agent context window',desc:'Auto-summarize and compress code state for long agent sessions.',tag:'agents'},
  {title:'Ad-hoc UI in chat agents',desc:'Let agents spawn temporary input forms dynamically inside chats.',tag:'agents'},
  {title:'Showcase n8n',desc:'Demonstrate n8n workflows powered by LLM actions and triggers.',tag:'tooling',url:'https://github.com/xoriors/experimental/tree/main/n8n'},
  {title:'Malware-detector AI agent',desc:'An agent that scans and flags malicious code.',tag:'security',url:'https://github.com/razvangabriel16/experimental/blob/brainstorming-razvangabriel16/malware-detection-with-llm/proposal.md'},
  {title:'Sommelier assistant with skills',desc:'Recommend wines using AI skills for pairing, taste and region.',tag:'ai'},
  {title:'git-clone post-op scanner',desc:'Scan newly cloned repos via an automated AI prompt workflow.',tag:'security'},
  {title:'LLM linter',desc:'Enforce linting rules and propose fixes using AI coding agents.',tag:'tooling',url:'https://github.com/xoriors/experimental/issues/3'},
  {title:'3D mannequin puppeteer',desc:'Pose and animate a 3D mannequin with coding agents.',tag:'agents'},
  {title:'In-browser file transfer',desc:'Peer-to-peer file transfer in the browser (part of SyncOxiders).',tag:'fs',url:'https://github.com/radumarias/syncoxiders/issues/34'},
  {title:'Error correction for data recovery',desc:'Use error-correcting codes to recover data in rencfs.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/277'},
  {title:'Passkey as 2FA to unlock the FS',desc:'Use a passkey as a second factor to unlock the encrypted filesystem.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/228'},
  {title:'Python bindings for rencfs',desc:'Expose the rencfs library to Python.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/203'},
  {title:'Bindings for other languages',desc:'Bring rencfs to languages beyond Python.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/202'},
  {title:'IPFS plugin for rencfs',desc:'Add an IPFS storage backend to the encrypted filesystem.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/255'},
  {title:'Add compression to rencfs',desc:'Transparent compression alongside encryption.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/236'},
  {title:'Move examples to separate crates',desc:'Refactor rencfs examples into standalone crates.',tag:'fs',url:'https://github.com/xoriors/rencfs/issues/276'}
];

// Contribute page: the few channels a newcomer needs, plus a how-to.
// The full directory (Slack workspaces, Meetup, personal profiles…) lives on
// the About page so the two pages don't repeat each other.
const CONTACT = [
  {label:'Discord',sub:'say hi, pick a project',glyph:'D',url:SITE.discord},
  {label:'GitHub · xoriors',sub:'org repos & issues',glyph:'GH',url:SITE.github},
  {label:'GitHub · radumarias',sub:'founder\'s repos',glyph:'RM',url:SITE.founderGithub},
  {label:'Email',sub:SITE.email,glyph:'@',url:'mailto:'+SITE.email},
  {label:'LinkedIn',sub:'company/xorio',glyph:'in',url:SITE.linkedin},
  {label:'Contributing guide',sub:'CONTRIBUTING.md',glyph:'↳',url:SITE.contributing}
];

const CONTRIBUTE_STEPS = [
  {t:'Pick a project',d:'Browse the gallery or the experiments backlog. Apps, repositories and half-formed ideas are all fair game.'},
  {t:'Claim an issue',d:'Comment on the GitHub issue (or open one) so nobody duplicates the work, then say hi on Discord — that is where the day-to-day conversation happens.'},
  {t:'Ship it in the open',d:'Fork, branch, open a pull request. Small, reviewed increments beat big drops; CI and a maintainer will look at it quickly.'}
];

const ABOUT_SERVICES = [
  {t:'High-performance systems',d:'Systems software in Rust — filesystems, distributed storage, encryption and OS-level tooling built for speed and safety.'},
  {t:'Robust web services',d:'Backends and APIs with gRPC, REST, tonic and serverless stacks — engineered to stay up and stay fast.'},
  {t:'Secure applications',d:'Security-first software: encrypted filesystems, cryptography, zeroized memory and safe-by-construction design.'},
  {t:'Open-source collaboration',d:'Everything is built in the open — public repos, public roadmaps, and contributors welcomed at every level.'}
];

const ABOUT_CONTACTS_XORIO = [
  {label:'Discord',sub:'discord.gg/3W3mwWvz8y',url:SITE.discord},
  {label:'Slack',sub:'xorio workspace',url:'https://join.slack.com/t/xorio/shared_invite/zt-2ujihv9b7-yXEIy0jD2fP3~GyPLhAorQ'},
  {label:'Slack',sub:'rencfs channel',url:'https://join.slack.com/t/rencfs/shared_invite/zt-2w9cpnql2-o0qtN_rXFNjHvp92qFhXCg'},
  {label:'Slack',sub:'Star Tech RD Reloaded',url:'https://join.slack.com/t/startech-rd-reloaded/shared_invite/zt-2zv2xjiz7-f~TmyNPgB_A_uM8ToGs8Yw'},
  {label:'Email',sub:SITE.email,url:'mailto:'+SITE.email},
  {label:'GitHub',sub:'github.com/xoriors',url:SITE.github},
  {label:'Meetup',sub:'star-tech-rd-reloaded',url:'https://www.meetup.com/star-tech-rd-reloaded'},
  {label:'LinkedIn',sub:'company/xorio',url:SITE.linkedin},
  {label:'Website',sub:'startech-rd.io',url:'https://startech-rd.io'}
];

const ABOUT_CONTACTS_PERSONAL = [
  {label:'Matrix',sub:'@xorio42:matrix.org',url:'https://matrix.to/#/@xorio42:matrix.org'},
  {label:'Telegram',sub:'t.me/xorio42',url:'https://t.me/xorio42'},
  {label:'GitHub',sub:'github.com/radumarias',url:SITE.founderGithub},
  {label:'DEV',sub:'dev.to/xorio42',url:'https://dev.to/xorio42'},
  {label:'Substack',sub:'@xorio42',url:'https://substack.com/@xorio42'},
  {label:'Medium',sub:'@xorio42',url:'https://medium.com/@xorio42'},
  {label:'X',sub:'x.com/xorio42',url:'https://x.com/xorio42'},
  {label:'LinkedIn',sub:'in/radumarias',url:'https://www.linkedin.com/in/radumarias'},
  {label:'Reddit',sub:'u/xorio4210',url:'https://www.reddit.com/user/xorio4210/'},
  {label:'Facebook',sub:'radumarias',url:'https://www.facebook.com/radumarias'},
  {label:'Instagram',sub:'radumarias',url:'https://www.instagram.com/radumarias'},
  {label:'Threads',sub:'radumarias',url:'https://threads.com/radumarias'}
];

const ABOUT_WRITING = {
  articles:[
    {t:"The Hitchhiker's Guide to Building an Encrypted Filesystem in Rust",url:'https://medium.com/@xorio42/list/the-hitchhikers-guide-to-building-an-encrypted-filesystem-828492b94c23'},
    {t:"A one-pager: The Hitchhiker's Guide to Building an Encrypted Filesystem in Rust",url:'https://github.com/xoriors/rencfs/blob/main/docs/The_Hitchhiker_s_Guide_to_Building_an_Encrypted_Filesystem_in_Rust.pdf'},
    {t:"The Hitchhiker's Guide to Building Distributed Filesystem",url:'https://medium.com/@xorio42/list/the-hitchhikers-guide-to-building-distributed-filesystem-317d40f38304'},
    {t:"Cap'n Proto in gRPC over HTTP/3 (QUIC)",url:'https://medium.com/@xorio42/project-idea-81c5a7faf307'}],
  slides:[
    {t:"The Hitchhiker's Guide to Building an Encrypted Filesystem",url:'https://miro.com/app/board/uXjVLa8i1h0=/?share_link_id=915475950725'},
    {t:'Basics of cryptography, Authenticated Encryption, Rust in cryptography and how to build an encrypted filesystem',url:'https://miro.com/app/board/uXjVLccxeCE=/?share_link_id=893688822262'}],
  talks:[
    {t:"The Hitchhiker's Guide to Building an Encrypted Filesystem",url:'https://startech-rd.io/hitchhikers-guide-to/'},
    {t:'Basics of cryptography, Authenticated Encryption, Rust in cryptography and how to build an encrypted filesystem',url:'https://www.youtube.com/live/HwmVxOl3pQg'}]
};

const ABOUT_STACK = [
  {group:'development',items:['Rust','gRPC','REST APIs','tonic','diesel','SQLite','SurrealDB','tikv','Raft protocol','Mainline DHT','BitTorrent','QUIC','FUSE','Cryptography','Zero-copy','Apache Arrow','Apache Flight','RDMA','Sharding algorithms','egui','Kotlin Multiplatform','Java','Spark','Flink','Airflow','Python','Go','Flutter']},
  {group:'ui & ux',items:['Figma','Figma Make','Adobe Suite','UX Pilot','Lovable','Mocha','Notion']},
  {group:'qa',items:['Manual testing','Test automation','AI-generated tests']}
];

module.exports = { SITE, DISCORD, PROJECTS, GROUPS, FILTERS, EXPERIMENTS, CONTACT, CONTRIBUTE_STEPS,
  ABOUT_SERVICES, ABOUT_CONTACTS_XORIO, ABOUT_CONTACTS_PERSONAL, ABOUT_WRITING, ABOUT_STACK };
